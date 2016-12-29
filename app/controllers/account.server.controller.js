import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import addressUtil from '../utils/address';

const LISTSIZE = 100; //list size

module.exports = {

	/**
     * get account list
     */
	accountList: (req, res, next) => {
		try{
			let page = 1;
			if(req.body.page){
				page = parseInt(req.body.page);
			}
			let Account = mongoose.model('Account');
			Account.find().sort({balance: -1}).skip(LISTSIZE*(page-1)).limit(LISTSIZE).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_accountArray = [];
				let r_account = null;
				let count = 0;
				doc.forEach((item, index) => {
					r_account = {};
					r_account.address = item.address;
					r_account.balance = item.balance;
					r_account.timeStamp = item.timeStamp;
					r_account.remark = item.remark;
					r_accountArray.push(r_account);
					nis.accountByAddress(item.address, data =>{
						r_accountArray[index].importance = (data && data.account && data.account.importance)?data.account.importance:0;
						count++;
						if(doc.length==count)
							res.json(r_accountArray);
					});
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get havrester list
     */
	harvesterList: (req, res, next) => {
		try{
			let page = 1;
			if(req.body.page){
				page = parseInt(req.body.page);
			}
			let Account = mongoose.model('Account');
			Account.find().sort({blocks: -1}).skip(LISTSIZE*(page-1)).limit(LISTSIZE).exec((err, doc) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_harvesterArray = [];
				let r_harvester = null;
				let count = 0;
				doc.forEach((item, index) => {
					r_harvester = {};
					r_harvester.address = item.address;
					r_harvester.importance = item.importance;
					r_harvester.blocks = item.blocks;
					r_harvester.fees = item.fees;
					r_harvester.lastBlock = item.lastBlock;
					r_harvester.remark = item.remark;
					r_harvesterArray.push(r_harvester);
					nis.accountByAddress(item.address, data =>{
						r_harvesterArray[index].importance = (data && data.account && data.account.importance)?data.account.importance:0;
						count++;
						if(doc.length==count)
							res.json(r_harvesterArray);
					});
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get account detail info
     */
	detail: (req, res, next) => {
		try{
			let address = req.body.address;
			address = address.replace(new RegExp(/(-)/g), '');
			if(!address){
				res.json({});
				return;
			}
			let r_account = {};
			nis.accountByAddress(address, data => {
				if(!data || !data.account){
					res.json({});
					return;
				}
				let meta = data.meta;
				let account = data.account;
				r_account.address = address;
				r_account.publicKey = account.publicKey;
				r_account.balance = account.balance;
				r_account.importance = account.importance;
				r_account.label = account.label!="null"?account.label:"";
				r_account.remoteStatus = meta.remoteStatus;
				let Account = mongoose.model("Account");
				Account.findOne({address: address}).exec((err, doc) => {
					if(!err && doc)
						r_account.remark = doc.remark;
				});
				if(meta.cosignatories && meta.cosignatories.length>0){
					r_account.multisig = 1;
					r_account.cosignatories = "";
					meta.cosignatories.forEach(co => {
						if(r_account.cosignatories=="")
							r_account.cosignatories = co.address;
						else
							r_account.cosignatories = r_account.cosignatories + "<br/>" + co.address;
					});
				}
				//query transactions of this account
				nis.accountTransferRecord(address, tx => {
					if(!tx || !tx.data){
						res.json(r_account);
						return;
					}
					let r_txList = [];
					let r_tx = null;
					tx.data.forEach(item => {
						r_tx = {};
						r_tx.id = item.meta.id;
						r_tx.timeStamp = item.transaction.timeStamp;
						r_tx.amount = item.transaction.amount?item.transaction.amount:0;
						r_tx.fee = item.transaction.fee;
						r_tx.sender = addressUtil.publicKeyToAddress(item.transaction.signer);
						r_tx.recipient = item.transaction.recipient;
						r_tx.height = item.meta.height;
						if(item.meta.hash && item.meta.hash.data)
							r_tx.hash = item.meta.hash.data;
						r_txList.push(r_tx);
					});
					r_account.txes = r_txList;
					res.json(r_account);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get transactions belong this account
     */
	detailTXList: (req, res, next) => {
		try {
			let address = req.body.address;
			let id = req.body.id;
			address = address.replace(new RegExp(/(-)/g), '');
			let r_txList = [];
			nis.accountTransferRecordAndID(address, id, data => {
				if(!data || !data.data){
					res.json([]);
					return;
				}
				let r_tx = null;
				data.data.forEach(item => {
					r_tx = {};
					r_tx.id = item.meta.id;
					r_tx.timeStamp = item.transaction.timeStamp;
					r_tx.amount = item.transaction.amount;
					r_tx.fee = item.transaction.fee;
					r_tx.sender = addressUtil.publicKeyToAddress(item.transaction.signer);
					r_tx.recipient = item.transaction.recipient;
					r_tx.height = item.meta.height;
					r_tx.signature = item.transaction.signature;
					if(item.meta.hash && item.meta.hash.data)
						r_tx.hash = item.meta.hash.data;

					r_txList.push(r_tx);
				});
				res.json(r_txList);
			});
		} catch (e) {
			console.error(e);
		}
	}
}