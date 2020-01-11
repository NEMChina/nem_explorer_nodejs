import transactionDB from '../db/transactionDB';
import blockDB from '../db/blockDB';
import mosaicDB from '../db/mosaicDB';
import mosaicTransactionDB from '../db/mosaicTransactionDB';
import namespaceDB from '../db/namespaceDB';
import accountDB from '../db/accountDB';
import supernodePayoutDB from '../db/supernodePayoutDB';
import nis from './nisRequest';
import address from './address';
import timeUtil from './timeUtil';
import messageUtil from './message';
import schedule from 'node-schedule';
import config from '../config/config';
import blockWS from '../websocket/blockWS';
import mosaicWS from '../websocket/mosaicWS';
import transactionWS from '../websocket/transactionWS';
import pollController from '../controllers/poll.server.controller';

let lastLoadedHeight = 0;
let initFinishFlag = false;
let foundAddressSet = new Set();
let foundBlockSet = new Set();

/**
 * init the blocks, transactions, account, namespace, mosaics and supernodes payout
 * data will be saving into the MongoDB
 */
let init = (server) => {
	nis.heartbeat((data)=>{
		//check NIS status
		if(!data || data.type!=2 || data.code!=1) {
			console.info('Error: Please make sure NIS has been started and blocks loading has been finished.');
			throw new Error('NIS error');
		}
		nis.blockHeight((height) => {
			//query max block height from NIS
			let heightNIS = height.height;
			log('height from NIS is ' + heightNIS);
			if(heightNIS<1) 
				return;
			//query max block height from DB
			transactionDB.findOneTransactionSortHeight(doc => {
				let heightDB = 0;
				if(doc && doc.height) 
					heightDB = doc.height-1;
				//testing
				if(heightDB < config.nisInitStartBlock)
					heightDB = config.nisInitStartBlock;
				//testing
				console.info('height from DB is ' + heightDB);
				if(heightDB==0){
					loadNemesisBlock();
					heightDB = 1;
				}
				// schedule update transactions
				loadBlocks(heightDB, data => {
					initFinishFlag = true;
					foundAddressSet = new Set();
					lastLoadedHeight = data;
					// schdule scan the new block after init finished (every 30 seconds)
					let scheduleRule = new schedule.RecurrenceRule();
					scheduleRule.second = [1];
					schedule.scheduleJob(scheduleRule, () => {
						loadBlocks(lastLoadedHeight, data => {
							lastLoadedHeight = data;
						});
					});
					// websocket update transactions
					transactionWS.transactionConnect((height, callback)=>{
						loadBlocks(height, callback);
					});
					transactionWS.unconfirmedConnect();
					blockWS.connect();
					mosaicWS.connect();
				});
			});
		});
	});
};

/**
 * load NemesisBlock (block height is 1)
 */
let loadNemesisBlock = () => {
	let params = JSON.stringify({"height": 1});
	nis.blockAtPublic(params, data => {
		if(!data) return log('<error>: get nothing from NemesisBlock');
		// save block
		saveBlock({height: 1, timeStamp: data.timeStamp});
		// save transactions
		let txes = data.transactions;
		let saveTxArr = [];
		for(let i in txes){
			let tx = txes[i];
			let saveTx = {};
			saveTx.hash = '#NemesisBlock#'+(i+1);
			saveTx.height = 1;
			saveTx.sender = tx.signer?address.publicKeyToAddress(tx.signer):'';
			saveTx.recipient = '';
			saveTx.recipient = tx.recipient?tx.recipient:saveTx.recipient;
			saveTx.recipient = tx.remoteAccount?address.publicKeyToAddress(tx.remoteAccount):saveTx.recipient;
			saveTx.amount = tx.amount?tx.amount:0;
			saveTx.fee = tx.fee?tx.fee:0;
			saveTx.timeStamp = tx.timeStamp?tx.timeStamp:0;
			saveTx.deadline = tx.deadline?tx.deadline:0;
			saveTx.signature = tx.signature?tx.signature:'';
			saveTx.type = tx.type?tx.type:0;
			saveTxArr.push(saveTx);
			//update the account info which is in DB
			let signer = tx.signer?address.publicKeyToAddress(tx.signer):null;
			let recipient = tx.recipient;
			let cosignatoryAccount = tx.cosignatoryAccount?address.publicKeyToAddress(tx.cosignatoryAccount):null;
			let otherAccount = tx.otherAccount?address.publicKeyToAddress(tx.otherAccount):null;
			updateAddress(signer, 1);
			updateAddress(recipient, 1);
			updateAddress(cosignatoryAccount,1 );
			updateAddress(otherAccount, 1);
			if(i==0)
				saveOrUpdateMosaic(saveTx, null); // init mosaic 'nem:xem'
		}
		//save the transaction into DB by batch
		transactionDB.saveTransactionByBatchNemesis(saveTxArr);
	});
};

/**
 * load the blocks (block height > 1)
 */
let loadBlocks = (height, callback) => {
	let params = JSON.stringify({"height": height});
	nis.blockList(params, data => {
		if(!data || !data.data || data.data.length==0)
			return callback(height);
		let lastBlockHeight = 0;
		data.data.forEach((item, blockIndex) => {
			let block = item.block;
			let txes = item.txes;
			lastBlockHeight = block.height;
			if(initFinishFlag==true && foundBlockSet.has(block.height))
				return;
			if(initFinishFlag==true)
				foundBlockSet.add(block.height);
			// save block
			saveBlock(block);
			//update the account info which is in DB
			if(block.signer)
				updateAddress(address.publicKeyToAddress(block.signer), block.height);
			txes.forEach((itemTx, index) => {
				handleTX(itemTx, index, block.height);
			});
		});
		//recurse to query the next 10 blocks
		loadBlocks(lastBlockHeight, callback);
	});
};

/**
 * handle tx
 */
let handleTX = (itemTx, index, height) => {
	let tx = itemTx.tx;
	let saveTx = {};
	saveTx.hash = itemTx.hash;
	saveTx.height = height;
	saveTx.index = index;
	saveTx.sender = tx.signer?address.publicKeyToAddress(tx.signer):'';
	saveTx.recipient = '';
	saveTx.recipient = tx.recipient?tx.recipient:saveTx.recipient;
	saveTx.recipient = tx.remoteAccount?address.publicKeyToAddress(tx.remoteAccount):saveTx.recipient;
	saveTx.amount = tx.amount?tx.amount:0;
	saveTx.amountForMosaic = tx.amount?tx.amount:0;
	saveTx.fee = tx.fee?tx.fee:0;
	saveTx.timeStamp = tx.timeStamp?tx.timeStamp:0;
	saveTx.deadline = tx.deadline?tx.deadline:0;
	saveTx.signature = tx.signature?tx.signature:'';
	saveTx.type = tx.type?tx.type:0;
	// check if apostille
	if(tx.type==257 && saveTx.recipient==config.apostilleAccount && tx.message && tx.message.type && tx.message.type==1){
		let message = messageUtil.hexToUtf8(tx.message.payload);
		if(message.indexOf('HEX:')==0)
			saveTx.apostilleFlag = 1;
	}
	// check if mosaic transafer
	if(tx.type==257 && tx.mosaics && tx.mosaics.length>0)
		saveTx.mosaicTransferFlag = 1;
	// check if multisig transaction
	if(tx.type==4100 && tx.signatures && tx.otherTrans){
		saveTx.amount = tx.otherTrans.amount?tx.otherTrans.amount:0;
		saveTx.amountForMosaic = tx.otherTrans.amount?tx.otherTrans.amount:0;
		saveTx.fee = tx.otherTrans.fee?tx.otherTrans.fee:0;
		saveTx.sender = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):"";
		saveTx.recipient = tx.otherTrans.recipient;
		// check if mosaic transafer
		if(tx.otherTrans.type==257 && tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0)
			saveTx.mosaicTransferFlag = 1;
	}
	// check if aggregate  modification transaction
	if((tx.type==4100 && tx.otherTrans && tx.otherTrans.type==4097) || tx.type==4097)
		saveTx.aggregateFlag = 1;
	// correct amount if mosaic
	saveTx.amount = correctAmountIfMosaic(saveTx, tx);
	//insert the transaction into DB
	transactionDB.saveTransaction(saveTx, index+1, successflag => {
		if(!successflag || successflag==false)
			return;
		// check if mosaic transafer
		if(tx.type==257 && tx.mosaics && tx.mosaics.length>0)
			saveMosaicTX(saveTx, tx.mosaics);
		// check if multisig transaction
		if(tx.type==4100 && tx.signatures && tx.otherTrans){
			// check if mosaic transafer
			if(tx.otherTrans.type==257 && tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0)
				saveMosaicTX(saveTx, tx.otherTrans.mosaics);
			// save namespace
			saveNamespace(saveTx, tx.otherTrans);
			// save or update mosaic
			saveOrUpdateMosaic(saveTx, tx.otherTrans);
		}
		// save namespace
		saveNamespace(saveTx, tx);
		// save or update mosaic
		saveOrUpdateMosaic(saveTx, tx);
		// save supernode payout
		saveSupernodePayout(saveTx, tx);
		// update the account info which is in DB
		let signer = tx.signer?address.publicKeyToAddress(tx.signer):null;
		let recipient = tx.recipient;
		let cosignatoryAccount = tx.cosignatoryAccount?address.publicKeyToAddress(tx.cosignatoryAccount):null;
		let otherAccount = tx.otherAccount?address.publicKeyToAddress(tx.otherAccount):null;
		updateAddress(signer, height);
		updateAddress(recipient, height);
		updateAddress(cosignatoryAccount, height);
		updateAddress(otherAccount, height);
		// update the account which is multisig transaction
		if(tx.signatures){
			for(let i=0;i<tx.signatures.length;i++){
				let signatureItem = tx.signatures[i];
				let signatureOtherAccount = signatureItem.otherAccount;
				let signatureSigner = signatureItem.signer?address.publicKeyToAddress(signatureItem.signer):null;
				updateAddress(signatureOtherAccount, height);
				updateAddress(signatureSigner, height);
			}
		}
		// update the account which is multisig transaction
		if(tx.otherTrans){
			let otherTransSigner = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):null;
			let otherTransRecipient = tx.otherTrans.recipient;
			updateAddress(otherTransSigner, height);
			updateAddress(otherTransRecipient, height);
		}
	});
}

/**
 * update the account info in DB
 */
let updateAddress = (address, height) => {
	if(!address)
		return;
	if(initFinishFlag==false){
		if(foundAddressSet.has(address)) 
			return;
		foundAddressSet.add(address);
	}
	//query account info from NIS
	nis.accountByAddress(address, data => {
		if(!data || !data.account) {
			log('<error> Block [' + height + '] query acc [' + address + '] from NIS');
			return;
		}
		let updateAccount = {};
		updateAccount.address = address;
		updateAccount.publicKey = data.account.publicKey;
		updateAccount.balance = data.account.balance;
		updateAccount.blocks = data.account.harvestedBlocks;
		updateAccount.label = data.account.label;
		updateAccount.lastBlock = 0;
		updateAccount.fees = 0;
		updateAccount.timeStamp = 0;
		updateAccount.height = height;
		//query account harvest info from NIS
		nis.harvestByAddress(address, null, [], data => {
			let fees = 0;
			data.forEach(item => {
				if(updateAccount.lastBlock==0)
					updateAccount.lastBlock = item.height;
				fees += item.totalFee;
			});
			updateAccount.fees = fees;
			//query lastest transaction timeStamp
			nis.accountTransferRecord(address, data => {
				if(data && data.data && data.data.length>0)
					 updateAccount.timeStamp = data.data[0].transaction.timeStamp;
				let update = {
					address: address,
					publicKey: updateAccount.publicKey, 
					balance: updateAccount.balance, 
					blocks: updateAccount.blocks, 
					label: updateAccount.label,
					lastBlock: updateAccount.lastBlock,
					fees: updateAccount.fees,
					timeStamp: updateAccount.timeStamp,
					height: height
				}
				//query the account remark and save the entity
				accountDB.findOneAccountRemark(updateAccount, remark => {
					if(remark)
						update.remark = remark.remark;
					accountDB.saveOrUpdateAccount(update, () => {
						// query account mosaic info from NIS
						nis.mosaicListByAddress(address, data => {
							if(!data || !data.data)
								return;
							mosaicDB.resetAccountMosaic(address, height, () => {
								let mosaicIDs = [];
								data.data.forEach(m => {
									if(!m.quantity || !m.mosaicId)
										return;
									let accountMosaic = {};
									accountMosaic.address = address;
									accountMosaic.mosaicID = m.mosaicId.namespaceId+":"+m.mosaicId.name;
									accountMosaic.quantity = m.quantity;
									mosaicDB.saveOrUpdateAccountMosaic(accountMosaic, height);
								});
							});
						});
					});
				});
			});
		});
	});
};

/**
 * save block info
 */
let saveBlock = (block) => {
	let saveBlock = {};
	saveBlock.height = block.height;
	saveBlock.timeStamp = block.timeStamp;
	blockDB.saveBlock(saveBlock);
};

let correctAmountIfMosaic = (saveTx, tx) => {
	let amount = saveTx.amount;
	let mosaics = [];
	if(tx.mosaics && tx.mosaics.length>0)
		mosaics = tx.mosaics;
	if(tx.otherTrans && tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0)
		mosaics = tx.otherTrans.mosaics;
	if(mosaics.length==0)
		return amount;
	amount = 0;
	mosaics.forEach(m => {
		if(m.mosaicId.namespaceId=="nem" && m.mosaicId.name=="xem")
			amount = m.quantity * (saveTx.amount / 1000000);
	});
	if(amount<1)
		amount = 0;
	return amount;
};

/**
 * check transaction exist in DB
 */
let checkTransactionExist = (hash, callback) => {
	transactionDB.findOneTransaction(hash, doc => {
		if(doc)
			callback(true);
		else 
			callback(false);
	});
};

/**
 * save mosaic transaction
 */
let saveMosaicTX = (saveTx, mosaics) => {
	let mosaicTx;
	let mosaicTxArr = [];
	let height = 0;
	mosaics.forEach((m, i) => {
		if(!m)
			return;
		let mosaicId = m.mosaicId;
		let quantity = m.quantity;
		if(!mosaicId || !mosaicId.namespaceId || !mosaicId.name || !quantity)
			return;
		mosaicTx = {};
		mosaicTx.hash = saveTx.hash;
		mosaicTx.sender = saveTx.sender;
		mosaicTx.recipient = saveTx.recipient;
		mosaicTx.timeStamp = saveTx.timeStamp;
		mosaicTx.namespace = mosaicId.namespaceId;
		mosaicTx.mosaic = mosaicId.name;
		mosaicTx.quantity = quantity * (saveTx.amountForMosaic / 1000000);
		// calculate the number, no = block height + tx index + mosaic index
		mosaicTx.no = saveTx.height;
		mosaicTx.no = mosaicTx.no * 1000 + (saveTx.index+1);
		mosaicTx.no = mosaicTx.no * 100 + (i+1);
		height = saveTx.height;
		mosaicTxArr.push(mosaicTx);
	});
	// insert mosaics into DB by batch
	if(mosaicTxArr.length>0)
		mosaicTransactionDB.saveMosaicTransactionByBatch(mosaicTxArr, height);
};

/**
 * save namespace
 */
let saveNamespace = (saveTx, tx) => {
	if(!tx.type || tx.type!=8193)
		return;
	let saveNamespace = {};
	saveNamespace.creator = saveTx.sender;
	saveNamespace.height = saveTx.height;
	saveNamespace.timeStamp = tx.timeStamp;
	saveNamespace.mosaics = 0;
	saveNamespace.expiredTime = timeUtil.getYearAddOneTimeInNem(saveTx.timeStamp);
	// calculate the number, no = block height + tx index
	saveNamespace.no = saveTx.height;
	saveNamespace.no = saveNamespace.no * 1000 + (saveTx.index+1);
	if(!tx.parent || tx.parent=="null"){ // root namespace
		saveNamespace.namespace = tx.newPart;
		saveNamespace.rootNamespace = tx.newPart;
		// check if renew
		namespaceDB.findOneNamespace(saveNamespace, doc => {
			if(!doc){ // new namespace
				namespaceDB.saveNamespace(saveNamespace);
			} else { // renew namespace
				let expiredTime = timeUtil.getYearAddOneTimeInNem(doc.expiredTime);
				namespaceDB.updateNamespaceExpiredTime(saveNamespace, expiredTime);
			}
		});
	} else { // sub namespace
		saveNamespace.namespace = tx.parent + '.' + tx.newPart;
		saveNamespace.rootNamespace = tx.parent;
		if(tx.parent.indexOf(".")!=-1)
			saveNamespace.rootNamespace = tx.parent.substring(0, tx.parent.indexOf("."));
		// save sub namespace
		namespaceDB.saveNamespace(saveNamespace);
		// update root namespace
		namespaceDB.updateRootNamespace(saveNamespace);
	}
};

/**
 * save or update mosaic
 */
let saveOrUpdateMosaic = (saveTx, tx) => {
	if(saveTx.height==1){ // save mosaic 'nem:xem'
		let mosaic = {};
		mosaic.mosaicName = "xem";
		mosaic.namespace = "nem";
		mosaic.mosaicID = mosaic.namespace + ":" + mosaic.mosaicName;
		mosaic.description = "";
		mosaic.timeStamp = saveTx.timeStamp;
		mosaic.creator = saveTx.sender;
		mosaic.height = saveTx.height;
		mosaic.divisibility = 6;
		mosaic.initialSupply = 8999999999;
		mosaic.supplyMutable = 0;
		mosaic.transferable = 1;
		mosaic.no = saveTx.height;
		mosaic.no = 1001;
		mosaicDB.saveOrUpdateMosaic(mosaic);
	} else if(tx.type && tx.type==16385 && tx.mosaicDefinition && tx.mosaicDefinition.id){ // save or update
		let mosaic = {};
		mosaic.mosaicName = tx.mosaicDefinition.id.name;
		mosaic.namespace = tx.mosaicDefinition.id.namespaceId;
		mosaic.mosaicID = mosaic.namespace + ":" + mosaic.mosaicName;
		mosaic.description = tx.mosaicDefinition.description;
		mosaic.timeStamp = tx.timeStamp;
		mosaic.creator = address.publicKeyToAddress(tx.mosaicDefinition.creator);
		mosaic.height = saveTx.height;
		if(!tx.mosaicDefinition.properties || tx.mosaicDefinition.properties.length==0)
			return;
		for(let i in tx.mosaicDefinition.properties){
			let property = tx.mosaicDefinition.properties[i];
			if(!property || !property.name || !property.value)
				continue;
			// mosaic properties
			if(property.name=="divisibility")
				mosaic.divisibility = property.value;
			if(property.name=="initialSupply")
				mosaic.initialSupply = property.value;
			if(property.name=="supplyMutable"){
				if(property.value=="false")
					mosaic.supplyMutable = 0;
				else if(property.value=="true")
					mosaic.supplyMutable = 1;
			}
			if(property.name=="transferable"){
				if(property.value=="false")
					mosaic.transferable = 0;
				else if(property.value=="true")
					mosaic.transferable = 1;
			}
		}
		// mosaic levy
		if(tx.mosaicDefinition.levy && tx.mosaicDefinition.levy.type){
			let levy = tx.mosaicDefinition.levy;
			mosaic.levyType = levy.type;
			mosaic.recipient = levy.recipient;
			mosaic.fee = levy.fee;
			if(levy.mosaicId && levy.mosaicId.namespaceId && levy.mosaicId.name){
				mosaic.levyNamespace = levy.mosaicId.namespaceId;
				mosaic.levyMosaic = levy.mosaicId.name;
				mosaic.levyRecipient = levy.recipient;
				mosaic.levyFee = levy.fee;
			}
		}
		// calculate the number, no = block height + tx index
		mosaic.no = saveTx.height;
		mosaic.no = mosaic.no * 1000 + (saveTx.index+1);
		mosaicDB.saveOrUpdateMosaic(mosaic);
	} else if (tx.type && tx.type==16386 && tx.mosaicId && tx.supplyType && tx.delta){ // update mosaic supply
		let mosaicName = tx.mosaicId.name;
		let namespace = tx.mosaicId.namespaceId;
		let change = 0;
		if(tx.supplyType==1) // increase
			change += tx.delta;
		else if(tx.supplyType==2) // decrease
			change -= tx.delta;
		mosaicDB.updateMosaicSupply(mosaicName, namespace, tx.timeStamp, change, saveTx.height);
	}
};

/**
 * save supernode payout
 */
let saveSupernodePayout = (saveTx, tx) => {
	if(saveTx.sender!=config.supernodePayoutAccount || !tx.message || !tx.message.type || tx.message.type!=1)
		return;
	let message = messageUtil.hexToUtf8(tx.message.payload);
	let regExp = /Node rewards payout: round (\d+)-(\d+)/;
	let match = message.match(regExp);
	if(match && match.length>0){
		let payout = {};
		payout.round = match[2];
		payout.sender = config.supernodePayoutAccount;
		payout.recipient = saveTx.recipient;
		payout.amount = saveTx.amount;
		payout.fee = saveTx.fee;
		payout.timeStamp = saveTx.timeStamp;
		supernodePayoutDB.saveSupernodePayout(payout);
	}
};

/**
 * log util
 */
let log = (message) => {
	console.info(message);
};

module.exports = {
	init,
	loadBlocks
}