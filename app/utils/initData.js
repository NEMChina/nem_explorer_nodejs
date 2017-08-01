import nis from './nisRequest';
import address from './address';
import mongoose from 'mongoose';
import schedule from 'node-schedule';
import config from '../config/config';
import messageUtil from './message';
import timeUtil from './timeUtil';
import channels from '../websocket/channels';

let lastLoadedHeight = 0;
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
			let Transaction = mongoose.model('Transaction');
			//query max block height from DB
			Transaction.findOne().sort('-height').exec((err, doc) => {
				if(err) 
					return log('<error> query max height from DB: ' + err);
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
					//schdule scan the new block after init finished (every 30 seconds)
					let scheduleRule = new schedule.RecurrenceRule();
					scheduleRule.second = [1];
					schedule.scheduleJob(scheduleRule, () => {
						foundAddressSet = new Set();
						loadBlocks(lastLoadedHeight, data => {
							lastLoadedHeight = data;
						});
					});
				});
			});
		});
	});
};

/**
 * load NemesisBlock (block height is 1)
 */
let loadNemesisBlock = () => {
	let Transaction = mongoose.model('Transaction');
	let params = JSON.stringify({"height": 1});
	nis.blockAtPublic(params, data => {
		if(!data) return log('<error>: get nothing from NemesisBlock');
		let txes = data.transactions;
		let saveTx = {};
		txes.forEach((tx, index) => {
			saveTx.hash = '#NemesisBlock#'+(index+1);
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
			//insert the transaction into DB
			new Transaction(saveTx).save(err => {
				if(err)
					log('<error> Block [1] create transaction [' + index + '] : ' + err);
				else
					log('<success> Block [1] create transaction [' + index + ']');
			});
			//update the account info which is in DB
			let signer = tx.signer?address.publicKeyToAddress(tx.signer):null;
			let recipient = tx.recipient;
			let cosignatoryAccount = tx.cosignatoryAccount?address.publicKeyToAddress(tx.cosignatoryAccount):null;
			let otherAccount = tx.otherAccount?address.publicKeyToAddress(tx.otherAccount):null;
			updateAddress(signer, 1);
			updateAddress(recipient, 1);
			updateAddress(cosignatoryAccount,1 );
			updateAddress(otherAccount, 1);
		});
	});
};

/**
 * load the blocks (block height > 1)
 */
let loadBlocks = (height, callback) => {
	let Namespace = mongoose.model('Namespace');
	let SupernodePayout = mongoose.model('SupernodePayout');
	let params = JSON.stringify({"height": height});
	nis.blockList(params, data => {
		if(!data || !data.data || data.data.length==0)
			return callback(height);
		data.data.forEach((item, blockIndex) => {
			let block = item.block;
			let txes = item.txes;
			//update the account info which is in DB
			if(block.signer)
				updateAddress(address.publicKeyToAddress(block.signer), block.height);
			let saveTx = {};
			txes.forEach((itemTx, index) => {
				let tx = itemTx.tx;
				saveTx = {};
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
					if(message.indexOf('HEX:')==0){
						saveTx.apostilleFlag = 1;
					}
				}
				// check if mosaic transafer
				if(tx.type==257 && tx.mosaics && tx.mosaics.length>0)
					saveTx.mosaicTransferFlag = 1;
				// check if multisig transaction
				if(tx.type==4100 && tx.signatures && tx.otherTrans){
					saveTx.amount = tx.otherTrans.amount?tx.otherTrans.amount:0;
					saveTx.fee = tx.otherTrans.fee?tx.otherTrans.fee:0;
					saveTx.sender = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):"";
					saveTx.recipient = tx.otherTrans.recipient;
				}
				// check if aggregate  modification transaction
				if((tx.type==4100 && tx.otherTrans && tx.otherTrans.type==4097) || tx.type==4097)
					saveTx.aggregateFlag = 1;
				let Transaction = mongoose.model('Transaction');
				//insert the transaction into DB
				new Transaction(saveTx).save(err => {
					if(!err) {
						log('<success> Block ['+block.height+'] found transaction [' + (index+1) + ']');
						//create namespace
						if(tx.type && tx.type==8193){
							let saveNamespace = {};
							if(!tx.parent || tx.parent=="null")
								saveNamespace.name = tx.newPart;
							else 
								saveNamespace.name = tx.parent + '.' + tx.newPart;
							saveNamespace.mosaics = 0;
							saveNamespace.timeStamp = saveTx.timeStamp;
							saveNamespace.height = saveTx.height;
							saveNamespace.creator = saveTx.sender;
							new Namespace(saveNamespace).save(err => {
								if(err)
									log('<error> Block [' + block.height + '] found namespace [' + saveNamespace.name + '] : ' + err);
								else
									log('<success> Block [' + block.height + '] found namespace [' + saveNamespace.name + ']');
							});
						}
						//update mosaics amount in specific namespace
						if(tx.type && tx.type==16385 && tx.mosaicDefinition && tx.mosaicDefinition.id){
							let namespace = tx.mosaicDefinition.id.namespaceId;
							Namespace.update({name: namespace}, {$inc: {mosaics: 1}}, (err, doc) => {
								if(err) return log('<error> Block [' + block.height + '] update namespace ['+namespace+'] mosaic : ' + err);
							});
						}
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
						//create supernode payout
						if(saveTx.sender==config.supernodePayoutAccount && tx.message && tx.message.type && tx.message.type==1){
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
								new SupernodePayout(payout).save(err => {
									if(err)
										console.error(err);
								});
							}
						}
					}
				});
			});
			//log('Start to load Block ['+block.height+']');
			//recurse to query the next 10 blocks
			if(data.data.length==blockIndex+1){
				loadBlocks(block.height, callback);
			}
		});
	});
};

/**
 * update the account info in DB
 */
let updateAddress = (address, height) => {
	if(!address || foundAddressSet.has(address)) {
		return;
	}
	foundAddressSet.add(address);
	let Account = mongoose.model('Account');
	let AccountRemark = mongoose.model('AccountRemark');
	//query account info from NIS
	nis.accountByAddress(address, data => {
		if(!data || !data.account) {
			log('<error> Block [' + height + '] query acccount [' + address + '] from NIS');
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
				//save or update account
				Account.findOne({address: address}, (err, addr) => {
					if(err){
						log('<error> Block [' + height + '] query ['+address+'] before saving/updating: ' + err);
						return;
					}
					if(addr){ //update
						let update = {
							publicKey: updateAccount.publicKey, 
							balance: updateAccount.balance, 
							blocks: updateAccount.blocks, 
							label: updateAccount.label,
							lastBlock: updateAccount.lastBlock,
							fees: updateAccount.fees,
							timeStamp: updateAccount.timeStamp
						}
						Account.update({address: address}, update, (err, doc) => {
							if(err) log('<error> Block [' + height + '] update ['+address+']: ' + err);
							else log('<success> Block [' + height + '] update ['+address+']');
						});
					} else { //save
						//query the account remark and save the entity
						AccountRemark.findOne({address: updateAccount.address}).exec((err, remark) => {
							if(!err && remark){
								updateAccount.remark = remark.remark;
							}
							new Account(updateAccount).save((err, doc) => {
								if(err) log('<error> Block [' + height + '] save ['+address+']: ' + err);
								else log('<success> Block [' + height + '] save ['+address+']');
							});
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
					for(var i=0;i<tx.signatures.length;i++){
						var signatureItem = tx.signatures[i];
						var signatureOtherAccount = signatureItem.otherAccount;
						var signatureSigner = signatureItem.signer?address.publicKeyToAddress(signatureItem.signer):null;
						updateAddress(signatureOtherAccount, block.height);
						updateAddress(signatureSigner, block.height);
					}
				}
				// update the account which is multisig transaction
				if(tx.otherTrans){
					var otherTransSigner = tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):null;
					var otherTransRecipient = tx.otherTrans.recipient;
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
 * log util
 */
let log = (message) => {
	console.info('=> ' + message);
}

module.exports = {
	init,
	loadBlocks,
	reloadAccountInfo
}