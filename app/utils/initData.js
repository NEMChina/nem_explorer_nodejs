import nis from './nisRequest';
import address from './address';
import schedule from 'node-schedule';
import config from '../config/config';
import messageUtil from './message';
import timeUtil from './timeUtil';
import dbUtil from './dbUtil';
import transactionWS from '../websocket/transactionWS';
import blockWS from '../websocket/blockWS';
import pollController from '../controllers/poll.server.controller';

let lastLoadedHeight = 0;
let blockSet = new Set();
let foundAddressSet = new Set();
let reloadFoundAddressSet = new Set();

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
			dbUtil.findOneTransactionSortHeight(doc => {
				let heightDB = 0;
				if(doc && doc.height) 
					heightDB = doc.height;
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
					lastLoadedHeight = data;
					// schdule scan the new block after init finished (every 30 seconds)
					let scheduleRule = new schedule.RecurrenceRule();
					scheduleRule.second = [1];
					schedule.scheduleJob(scheduleRule, () => {
						foundAddressSet = new Set();
						loadBlocks(lastLoadedHeight, data => {
							lastLoadedHeight = data;
						});
					});
					// websocket update transactions
					transactionWS.transaction((height, callback)=>{
						loadBlocks(height, callback);
					});
					transactionWS.unconfirmedTransaction();
					transactionWS.cleanHistoryUnconfirmedWhenInit();
					blockWS.block();
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
		}
		//save the transaction into DB by batch
		dbUtil.saveTransactionByBatch(saveTxArr);
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
		data.data.forEach((item, blockIndex) => {
			let block = item.block;
			let txes = item.txes;
			// save block
			saveBlock(block);
			//update the account info which is in DB
			if(block.signer)
				updateAddress(address.publicKeyToAddress(block.signer), block.height);
			txes.forEach((itemTx, index) => {
				let tx = itemTx.tx;
				let saveTx = {};
				saveTx.hash = itemTx.hash;
				saveTx.height = block.height;
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
				// check if apostille
				if(tx.type==257 && saveTx.recipient==config.apostilleAccount && tx.message && tx.message.type && tx.message.type==1){
					let message = messageUtil.hexToUtf8(tx.message.payload);
					if(message.indexOf('HEX:')==0)
						saveTx.apostilleFlag = 1;
				}
				// check if mosaic transafer
				if(tx.type==257 && tx.mosaics && tx.mosaics.length>0){
					saveTx.mosaicTransferFlag = 1;
					saveMosaicTX(saveTx, tx.mosaics);
				}
				// check if multisig transaction
				if(tx.type==4100 && tx.signatures && tx.otherTrans){
					saveTx.amount = tx.otherTrans.amount?tx.otherTrans.amount:0;
					saveTx.fee = tx.otherTrans.fee?tx.otherTrans.fee:0;
					saveTx.sender = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):"";
					saveTx.recipient = tx.otherTrans.recipient;
					// check if mosaic transafer
					if(tx.otherTrans.type==257 && tx.otherTrans.mosaics && tx.otherTrans.mosaics.length>0){
						saveTx.mosaicTransferFlag = 1;
						saveMosaicTX(saveTx, tx.otherTrans.mosaics);
					}
					// save namespace
					saveNamespace(saveTx, tx.otherTrans);
					// save or update mosaic
					saveOrUpdateMosaic(saveTx, tx.otherTrans);
					// save poll
					savePoll(saveTx, tx.otherTrans);
				}
				// check if aggregate  modification transaction
				if((tx.type==4100 && tx.otherTrans && tx.otherTrans.type==4097) || tx.type==4097)
					saveTx.aggregateFlag = 1;
				// save namespace
				saveNamespace(saveTx, tx);
				// save or update mosaic
				saveOrUpdateMosaic(saveTx, tx);
				// save supernode payout
				saveSupernodePayout(saveTx, tx);
				// save poll
				savePoll(saveTx, tx);
				// update the account info which is in DB
				let signer = tx.signer?address.publicKeyToAddress(tx.signer):null;
				let recipient = tx.recipient;
				let cosignatoryAccount = tx.cosignatoryAccount?address.publicKeyToAddress(tx.cosignatoryAccount):null;
				let otherAccount = tx.otherAccount?address.publicKeyToAddress(tx.otherAccount):null;
				updateAddress(signer, block.height);
				updateAddress(recipient, block.height);
				updateAddress(cosignatoryAccount, block.height);
				updateAddress(otherAccount, block.height);
				// update the account which is multisig transaction
				if(tx.signatures){
					for(let i=0;i<tx.signatures.length;i++){
						let signatureItem = tx.signatures[i];
						let signatureOtherAccount = signatureItem.otherAccount;
						let signatureSigner = signatureItem.signer?address.publicKeyToAddress(signatureItem.signer):null;
						updateAddress(signatureOtherAccount, block.height);
						updateAddress(signatureSigner, block.height);
					}
				}
				// update the account which is multisig transaction
				if(tx.otherTrans){
					let otherTransSigner = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):null;
					let otherTransRecipient = tx.otherTrans.recipient;
					updateAddress(otherTransSigner, block.height);
					updateAddress(otherTransRecipient, block.height);
				}
				//insert the transaction into DB
				dbUtil.saveTransaction(saveTx, index+1);
			});
			//recurse to query the next 10 blocks
			if(data.data.length==blockIndex+1)
				loadBlocks(block.height, callback);
		});
	});
};

/**
 * update the account info in DB
 */
let updateAddress = (address, height) => {
	if(!address || foundAddressSet.has(address)) 
		return;
	foundAddressSet.add(address);
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
				dbUtil.findOneAccount(address, addr => {
					if(addr){ //update
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
						dbUtil.updateAccount(update);
					} else { //save
						//query the account remark and save the entity
						dbUtil.findOneAccountRemark(updateAccount, remark => {
							if(remark)
								updateAccount.remark = remark.remark;
							dbUtil.saveAccount(updateAccount);
						});
					}
				});
			});
		});
	});
};

/**
 * reload account info (block height > 1)
 */
let reloadAccountInfo = (height) => {
	let params = JSON.stringify({"height": height});
	nis.blockList(params, data => {
		if(!data || !data.data || data.data.length==0){
			reloadFoundAddressSet = new Set();
			return;
		}
		data.data.forEach((item, blockIndex) => {
			let block = item.block;
			let txes = item.txes;
			//update the account info which is in DB
			if(block.signer)
				updateAddress(address.publicKeyToAddress(block.signer), block.height);
			txes.forEach((itemTx, index) => {
				let tx = itemTx.tx;
				//update the account info which is in DB
				let signer = tx.signer?address.publicKeyToAddress(tx.signer):null;
				let recipient = tx.recipient;
				let cosignatoryAccount = tx.cosignatoryAccount?address.publicKeyToAddress(tx.cosignatoryAccount):null;
				let otherAccount = tx.otherAccount?address.publicKeyToAddress(tx.otherAccount):null;
				updateAddress(signer, block.height);
				updateAddress(recipient, block.height);
				updateAddress(cosignatoryAccount, block.height);
				updateAddress(otherAccount, block.height);
				// update the account which is multisig transaction
				if(tx.signatures){
					for(let i=0;i<tx.signatures.length;i++){
						let signatureItem = tx.signatures[i];
						let signatureOtherAccount = signatureItem.otherAccount;
						let signatureSigner = signatureItem.signer?address.publicKeyToAddress(signatureItem.signer):null;
						updateAddress(signatureOtherAccount, block.height);
						updateAddress(signatureSigner, block.height);
					}
				}
				// update the account which is multisig transaction
				if(tx.otherTrans){
					let otherTransSigner = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):null;
					let otherTransRecipient = tx.otherTrans.recipient;
					updateAddress(otherTransSigner, block.height);
					updateAddress(otherTransRecipient, block.height);
				}
			});
			//log('Start to load Block ['+block.height+']');
			//recurse to query the next 10 blocks
			if(data.data.length==blockIndex+1){
				reloadAccountInfo(block.height);
			}
		});
	});
};

/**
 * save block info
 */
let saveBlock = (block) => {
	if(blockSet.has(block.height)){
		return;
	}
	let saveBlock = {};
	saveBlock.height = block.height;
	saveBlock.timeStamp = block.timeStamp;
	dbUtil.saveBlock(saveBlock);
};

/**
 * save mosaic transaction
 */
let saveMosaicTX = (saveTx, mosaics) => {
	let mosaicTx;
	let mosaicTxArr = [];
	let height = 0;
	for(let i in mosaics){
		if(!mosaics[i])
			continue;
		let mosaicId = mosaics[i].mosaicId;
		let quantity = mosaics[i].quantity;
		if(!mosaicId || !mosaicId.namespaceId || !mosaicId.name || !quantity)
			continue;
		mosaicTx = {};
		mosaicTx.hash = saveTx.hash;
		mosaicTx.sender = saveTx.sender;
		mosaicTx.recipient = saveTx.recipient;
		mosaicTx.timeStamp = saveTx.timeStamp;
		mosaicTx.namespace = mosaicId.namespaceId;
		mosaicTx.mosaic = mosaicId.name;
		mosaicTx.quantity = quantity;
		height = saveTx.height;
		mosaicTxArr.push(mosaicTx);
	}
	// insert mosaics into DB by batch
	if(mosaicTxArr.length>0)
		dbUtil.saveMosaicTransactionByBatch(mosaicTxArr, height);
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
	if(!tx.parent || tx.parent=="null"){ // root namespace
		saveNamespace.namespace = tx.newPart;
		// check if renew
		dbUtil.findOneNamespace(saveNamespace, doc => {
			if(!doc){ // new namespace
				dbUtil.saveNamespace(saveNamespace);
			} else { // renew namespace
				let expiredTime = timeUtil.getYearAddOneTimeInNem(doc.expiredTime);
				dbUtil.updateNamespaceExpiredTime(saveNamespace, expiredTime);
			}
		});
	} else { // sub namespace
		saveNamespace.name = tx.parent + '.' + tx.newPart;
		saveNamespace.rootNamespace = tx.parent.substring(0, tx.parent.indexOf("."));
		// save sub namespace
		dbUtil.saveNamespace(saveNamespace);
		// update parent namespace
		dbUtil.updateParentNamespace(saveNamespace, tx.parent);
	}
};

/**
 * save or update mosaic
 */
let saveOrUpdateMosaic = (saveTx, tx) => {
	if(tx.type && tx.type==16385 && tx.mosaicDefinition && tx.mosaicDefinition.id){ // save
		let mosaic = {};
		mosaic.mosaicName = tx.mosaicDefinition.id.name;
		mosaic.namespace = tx.mosaicDefinition.id.namespaceId;
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
			if(property.name=="supplyMutable")
				mosaic.supplyMutable = property.value;
			if(property.name=="transferable")
				mosaic.transferable = property.value;
		}
		// mosaic levy
		if(tx.mosaicDefinition.levy){
			let levy = tx.mosaicDefinition.levy;
			mosaic.levyType = levy.type;
			mosaic.recipient = levy.recipient;
			mosaic.fee = levy.fee;
			if(levy.mosaicId && levy.mosaicId.namespaceId && levy.mosaicId.name){
				mosaic.levyNamespace = levy.mosaicId.namespaceId;
				mosaic.levyMosaic = levy.mosaicId.name;
			}
		}
		dbUtil.saveMosaic(mosaic);
		// update namespace mosaics
		dbUtil.updateNamespaceMosaics(mosaic.namespace, saveTx.height);
	} else if (tx.type && tx.type==16386 && tx.mosaicId && tx.supplyType && tx.delta){ // update mosaic supply
		let mosaicName = tx.mosaicId.name;
		let namespace = tx.mosaicId.namespaceId;
		dbUtil.findOneMosaicByMosaicNameAndNamespace(mosaicName, namespace, doc => {
			if(!doc)
				return;
			let supply = doc.initialSupply;
			if(tx.supplyType==1) // increase
				supply += tx.delta;
			else if(tx.supplyType==1) // decrease
				supply -= tx.delta;
			dbUtil.updateMosaicSupply(mosaicName, namespace, supply, saveTx.height);
		});
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
		dbUtil.saveSupernodePayout(payout);
	}
};

/**
 * save poll
 */
let savePoll = (saveTx, tx) => {
	if(saveTx.type!=257 || saveTx.recipient!=config.pollAccount || !tx.message || !tx.message.type || tx.message.type!=1)
		return;	
	let message = messageUtil.hexToUtf8(tx.message.payload);
	pollController.savePoll(saveTx.sender, saveTx.timeStamp, message);
};

/**
 * log util
 */
let log = (message) => {
	console.info(message);
};

module.exports = {
	init,
	loadBlocks,
	reloadAccountInfo
}