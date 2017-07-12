import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import address from '../utils/address';
import message from '../utils/message';

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
			console.info(type);
			if(type=="transfer")
				conditions.type = 257;
			else if(type=="importance")
				conditions.type = 2049;
			else if(type=="multisig"){
				conditions = [];
				conditions.push({type: 4097});
				conditions.push({type: 4098});
				conditions.push({type: 4099});
				conditions.push({type: 4100});
				conditions = {"$or": conditions};
			}
			else if(type=="namespace")
				conditions.type = 8193;
			else if(type=="mosaic"){
				conditions = [];
				conditions.push({type: 16385});
				conditions.push({type: 16386});
				conditions = {"$or": conditions};
			}
			else if(type=="apostille")
				conditions.type = 10001;
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
								if(tx.tx.message && tx.tx.message.type)
									tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
								if(tx.tx.remoteAccount)
									tx.tx.remoteAccount = address.publicKeyToAddress(tx.tx.remoteAccount);
								tx.height = height;
								res.json(tx);
								return;
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
							if(tx.tx.message && tx.tx.message.type)
								tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
							if(tx.tx.modifications){
								tx.tx.modifications.forEach(m => {
									m.cosignatoryAccount = address.publicKeyToAddress(m.cosignatoryAccount);
								});
							}
							if(tx.tx.remoteAccount)
								tx.tx.remoteAccount = address.publicKeyToAddress(tx.tx.remoteAccount);
							tx.height = height;
							res.json(tx);
							return;
						}
					});
				});
			}
		} catch (e) {
			console.error(e);
		}
	}
}