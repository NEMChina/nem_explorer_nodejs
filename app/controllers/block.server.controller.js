import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import address from '../utils/address';
import message from '../utils/message';

const BLOCKLISTSIZE = 10;

module.exports = {

	/**
     * get current block info
     */
	blockHeight: (req, res, next) => {
		try {
			nis.blockHeight(data => {
				res.json(data);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get block list (paging)
     */
	blockList: (req, res, next) => {
		try {
			//query current block height
			nis.blockHeight(currentHeightObj => {
				let page = 1;
				if(req.body.page)
					page = req.body.page;
				let height = currentHeightObj.height;
				height = height - (10+BLOCKLISTSIZE*(page-1));
				let heightObj = JSON.stringify({"height": height});
				//query block list
				nis.blockList(heightObj, data => {
					//return a empty array if there is no data
					if(!data || !data.data){
						res.json([]);
						return;
					}
					let r_blockArray = [];
					let r_block = null;
					data.data.forEach(item => {
						r_block = {};
						r_block.hash = item.hash;
						r_block.height = item.block.height;
						r_block.timeStamp = item.block.timeStamp;
						r_block.txAmount = item.txes.length;
						r_block.txFee = 0;
						item.txes.forEach(tx => { //convert publicKey to address
							r_block.txFee += tx.tx.fee;
							tx.tx.signerAccount = address.publicKeyToAddress(tx.tx.signer);
							if(tx.tx.otherTrans && tx.tx.otherTrans.signer)
								tx.tx.otherTrans.sender = address.publicKeyToAddress(tx.tx.otherTrans.signer);
							if(tx.tx.signatures) {
								tx.tx.signatures.forEach(signature => {
									signature.sender = address.publicKeyToAddress(signature.signer);
								});
							}
						});
						r_block.harvester = address.publicKeyToAddress(item.block.signer);
						r_block.txes = item.txes;
						r_block.txes.forEach(tx => { //decode message if type = 1
							if(tx && tx.tx && tx.tx.message && tx.tx.message.type)
								tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
						});
						r_blockArray.push(r_block);
					});
					r_blockArray.reverse();
					res.json(r_blockArray);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get block info
     */
	blockAt: (req, res, next) => {
		try {
			let params = JSON.stringify({"height": req.body.height});
			nis.blockAtPublic(params, data => {
				res.json(data);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get block info when using the searching action
     */
	blockAtBySearch: (req, res, next) => {
		try {
			if(!req.body.height || parseInt(req.body.height)<1){
				res.json({});
				return;
			}
			let height = parseInt(req.body.height);
			let r_block = {};
			if(height==1){ //Nemsis Block
				let params = JSON.stringify({"height": 1});
				nis.blockAtPublic(params, data => {
					r_block.height = 1;
					r_block.timeStamp = 0;
					r_block.difficulty = "#";
					r_block.txAmount = data.transactions.length;
					r_block.txFee = 0;
					r_block.signer = "#";
					r_block.hash = "#";
					data.transactions.forEach(tx => {
						tx.signerAccount = address.publicKeyToAddress(tx.signer);
						tx.height = 1;
						tx.timeStamp = 0;
					});
					r_block.txes = data.transactions;
					res.json(r_block);
				});
			} else { //non nemsis block
				let params = JSON.stringify({"height": height-1});
				nis.blockList(params, data => {
					if(!data || !data.data || data.data.length==0){
						res.json(r_block);
						return;
					}
					let block = data.data[0];
					r_block.height = height;
					r_block.timeStamp = block.block.timeStamp;
					r_block.difficulty = block.difficulty;
					r_block.txAmount = block.txes.length;
					let txFee = 0;
					block.txes.forEach(tx => {
						txFee += tx.tx.fee;
						tx.tx.signerAccount = address.publicKeyToAddress(tx.tx.signer);
						tx.tx.height = height;
						if(tx && tx.tx && tx.tx.message && tx.tx.message.type)
							tx.tx.message.payload = message.hexToUtf8(tx.tx.message.payload);
					});
					r_block.txFee = txFee;
					r_block.signer = address.publicKeyToAddress(block.block.signer);
					r_block.hash = block.hash;
					r_block.txes = block.txes;
					res.json(r_block);
				});
			}
		} catch (e) {
			console.error(e);
		}
	}
}