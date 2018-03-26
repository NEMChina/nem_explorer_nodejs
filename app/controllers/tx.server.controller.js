import mongoose from 'mongoose';
import config from '../config/config';
import nis from '../utils/nisRequest';
import address from '../utils/address';
import message from '../utils/message';
import mosaicDB from '../db/mosaicDB';

const TXLISTSIZE = 10;

module.exports = {

	/**
     * get transactions list
     */
	txList: (req, res, next) => {
		try {
			let Transaction = mongoose.model('Transaction');
			let skip = (req.body.page-1)*TXLISTSIZE;
			let type = req.body.type;
			let conditions = {};
			if(type=="transfer")
				conditions.type = 257;
			else if(type=="importance")
				conditions.type = 2049;
			else if(type=="multisig")
				conditions.type = 4100;
			else if(type=="namespace")
				conditions.type = 8193;
			else if(type=="mosaic")
				conditions = {"$or":[{type: 16385}, {type: 16386}, {mosaicTransferFlag: 1}]};
			else if(type=="apostille")
				conditions.apostilleFlag = 1;
			else if(type=="aggregate")
				conditions.aggregateFlag = 1;
			Transaction.find(conditions).sort({height: -1, timeStamp: -1}).skip(skip).limit(TXLISTSIZE).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_txArray = [];
				let r_tx = null;	
				doc.forEach(item => {
					r_tx = {};
					r_tx.hash = item.hash;
					r_tx.height = item.height;
					r_tx.sender = item.sender;
					r_tx.recipient = item.recipient;
					r_tx.amount = item.amount;
					r_tx.fee = item.fee;
					r_tx.timeStamp = item.timeStamp;
					r_tx.signature = item.signature;
					r_tx.type = item.type;
					r_tx.apostilleFlag = item.apostilleFlag;
					r_tx.mosaicTransferFlag = item.mosaicTransferFlag;
					r_tx.aggregateFlag = item.aggregateFlag;
					r_txArray.push(r_tx);
				});
				res.json(r_txArray);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get tx detail
     */
	tx: (req, res, next) => {
		try {
			let height = req.body.height;
			let hash = req.body.hash;
			let recipient = req.body.recipient;
			if(!height || parseInt(height)==0){
				let Transaction = mongoose.model('Transaction');
				Transaction.findOne({hash: hash}).exec((err, doc) => {
					if(err){
						res.json({});
						return;
					}
					if(!doc || !doc.height){
						res.json({});
						return;
					}
					height = doc.height;
					let params = JSON.stringify({"height": height-1});
					nis.blockList(params, data => {
						if(!data || !data.data || data.data.length==0)
							res.json({});
						let block = data.data[0];
						block.txes.forEach(tx => {
							if(tx.hash==hash){
								tx.tx.signerAccount = address.publicKeyToAddress(tx.tx.signer);
								if(tx.tx.otherTrans && tx.tx.otherTrans.signer)
									tx.tx.otherTrans.sender = address.publicKeyToAddress(tx.tx.otherTrans.signer);
								if(tx.tx.signatures) {
									tx.tx.signatures.forEach(signature => {
										signature.sender = address.publicKeyToAddress(signature.signer);
									});
								}
								if(tx.tx.message && tx.tx.message.type && tx.tx.message.type==1 && tx.tx.message.payload)
									tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
								if(tx.tx.remoteAccount)
									tx.tx.remoteAccount = address.publicKeyToAddress(tx.tx.remoteAccount);
								if(tx.tx.otherTrans){
									// message
									if(tx.tx.otherTrans.message){
										if(tx.tx.otherTrans.message.type && tx.tx.otherTrans.message.type==1 && tx.tx.otherTrans.message.payload)
											tx.tx.otherTrans.message.payload = message.hexToUtf8(tx.tx.otherTrans.message.payload);
									}
									// modifications
									if(tx.tx.otherTrans.modifications){
										tx.tx.otherTrans.modifications.forEach(modification => {
											modification.cosignatoryAccount = address.publicKeyToAddress(modification.cosignatoryAccount);
										});
									}
								}
								checkApostilleAndMosaicTransferFromTX(tx);
								tx.height = height;
								formatMosaicDivisibility(tx, () => {
									res.json(tx);
									return;
								});
							}
						});
					});
				});
			} else if(parseInt(height)==1) {
				let params = JSON.stringify({"height": 1});
				nis.blockAtPublic(params, data => {
					if(!data){
						res.json({});
						return;
					}
					data.transactions.forEach(tx => {
						if(tx.recipient == recipient){
							tx.tx = {};
							tx.tx.timeStamp = tx.timeStamp;
							tx.tx.signerAccount = address.publicKeyToAddress(tx.signer);
							tx.tx.amount = tx.amount;
							tx.tx.recipient = tx.recipient;
							tx.tx.fee = tx.fee;
							tx.tx.type = 257;
							if(tx.message && tx.message.type){
								tx.tx.message = {};
								tx.tx.message.payload = message.hexToUtf8(tx.message.payload);
							}
							tx.height = height;
							res.json(tx);
							return;
						}
					});
				});
			} else {
				let params = JSON.stringify({"height": height-1});
				nis.blockList(params, data => {
					if(!data || !data.data || data.data.length==0){
						res.json({});
						return;
					}
					let block = data.data[0];
					block.txes.forEach(tx => {
						if(tx.hash==hash){
							tx.tx.signerAccount = address.publicKeyToAddress(tx.tx.signer);
							if(tx.tx.otherTrans && tx.tx.otherTrans.signer)
								tx.tx.otherTrans.sender = address.publicKeyToAddress(tx.tx.otherTrans.signer);
							if(tx.tx.signatures) {
								tx.tx.signatures.forEach(signature => {
									signature.sender = address.publicKeyToAddress(signature.signer);
								});
							}
							if(tx.tx.message && tx.tx.message.type && tx.tx.message.type==1 && tx.tx.message.payload)
								tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
							if(tx.tx.modifications){
								tx.tx.modifications.forEach(m => {
									m.cosignatoryAccount = address.publicKeyToAddress(m.cosignatoryAccount);
								});
							}
							if(tx.tx.remoteAccount)
								tx.tx.remoteAccount = address.publicKeyToAddress(tx.tx.remoteAccount);
							if(tx.tx.otherTrans){
								// message
								if(tx.tx.otherTrans.message){
									if(tx.tx.otherTrans.message.type && tx.tx.otherTrans.message.type==1 
										&& tx.tx.otherTrans.message.payload)
										tx.tx.otherTrans.message.payload = message.hexToUtf8(tx.tx.otherTrans.message.payload);
								}
								// modifications
								if(tx.tx.otherTrans.modifications){
									tx.tx.otherTrans.modifications.forEach(modification => {
										modification.cosignatoryAccount = address.publicKeyToAddress(modification.cosignatoryAccount);
									});
								}
							}
							checkApostilleAndMosaicTransferFromTX(tx);
							tx.height = height;
							formatMosaicDivisibility(tx, () => {
								res.json(tx);
								return;
							});
						}
					});
				});
			}
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get unconfirmed transactions list
     */
	unconfirmedTXList: (req, res, next) => {
		try {
			let UnconfirmedTransaction = mongoose.model('UnconfirmedTransaction');
			UnconfirmedTransaction.find({}).sort({timeStamp: -1}).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_txArray = [];
				let r_tx = null;
				doc.forEach(item => {
					if(!item || !item.detail)
						return;
					let tx = null;
					try {
						tx = JSON.parse(item.detail);
					} catch (e) {
						console.error(e);
					}
					if(!tx)
						return;
					tx.sender = address.publicKeyToAddress(tx.signer);
					if(tx.type==4100 && tx.otherTrans){
						tx.otherTrans.sender =  tx.otherTrans.signer?address.publicKeyToAddress(tx.otherTrans.signer):'';
						if(tx.otherTrans.message && tx.otherTrans.message.type && tx.otherTrans.message.type==1)
							tx.otherTrans.message.payload = message.hexToUtf8(tx.otherTrans.message.payload);
					}
					if(tx.message && tx.message.type && tx.message.type==1){
						tx.message.payload = message.hexToUtf8(tx.message.payload);
					}
					r_txArray.push(tx);
				});
				res.json(r_txArray);
			});
		} catch (e) {
			console.error(e);
		}
	}
};

let checkApostilleAndMosaicTransferFromTX = (tx) => {
	// check if apostille
	if(tx.tx.type==257 && tx.tx.recipient==config.apostilleAccount && tx.tx.message && tx.tx.message.type && tx.tx.message.type==1){
		if(tx.tx.message.payload.indexOf('HEX:')==0){
			tx.tx.apostilleFlag = 1;
		}
	}
	// check if mosaic transafer
	if(tx.tx.type==257 && tx.tx.mosaics && tx.tx.mosaics.length>0)
		tx.tx.mosaicTransferFlag = 1;
};

let formatMosaicDivisibility = (tx, callback) => {
	// collect all query mosaic params
	let findMosaicParams = [];
	if(tx.tx.mosaics && tx.tx.mosaics.length>0){
		tx.tx.mosaics.forEach(mosaic => {
			let m = mosaic.mosaicId.name;
			let ns = mosaic.mosaicId.namespaceId;
			findMosaicParams.push({mosaicName: m, namespace: ns});
		});
	}
 	if(tx.tx.otherTrans && tx.tx.otherTrans.mosaics && tx.tx.otherTrans.mosaics.length>0){
 		tx.tx.otherTrans.mosaics.forEach(mosaic => {
 			let m = mosaic.mosaicId.name;
 			let ns = mosaic.mosaicId.namespaceId;
 			findMosaicParams.push({mosaicName: m, namespace: ns});
 		});
 	}
 	if(findMosaicParams.length==0){
 		callback();
 		return;
 	}
 	// query mosaic
 	mosaicDB.findMosaics(findMosaicParams, mosaics => {
		let divMap = new Map();
		mosaics.forEach(m => {
			if(m)
				divMap.set(m.namespace+":"+m.mosaicName, m.divisibility);
		});
		// set divisibility into tx
		if(tx.tx.mosaics && tx.tx.mosaics.length>0){
			tx.tx.mosaics.forEach((mosaic, i) => {
				let id = mosaic.mosaicId.namespaceId+":"+mosaic.mosaicId.name;
				if(divMap.has(id))
					tx.tx.mosaics[i].divisibility = divMap.get(id);
			});
		}
	 	if(tx.tx.otherTrans && tx.tx.otherTrans.mosaics && tx.tx.otherTrans.mosaics.length>0){
	 		tx.tx.otherTrans.mosaics.forEach((mosaic, i) => {
	 			let id = mosaic.mosaicId.namespaceId+":"+mosaic.mosaicId.name;
				if(divMap.has(id))
					tx.tx.otherTrans.mosaics[i].divisibility = divMap.get(id);
	 		});
	 	}
	 	callback();
	});
};