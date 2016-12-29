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
			Transaction.find().sort({height: -1, timeStamp: -1}).skip(skip).limit(TXLISTSIZE).exec((err, doc) => {
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