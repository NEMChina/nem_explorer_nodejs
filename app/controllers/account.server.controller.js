import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import addressUtil from '../utils/address';
import cache from '../cache/appCache';
import init from '../utils/initData';
import timeUtil from '../utils/timeUtil';
import dbUtil from '../utils/dbUtil';
import mosaicController from './mosaic.server.controller';

const LISTSIZE = 100; //list size
const MOSIALISTSIZE = 25;
const UPDATETIME = 24*60*60*1000;

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
				r_account.harvestedBlocks = account.harvestedBlocks;
				r_account.vestedBalance = account.vestedBalance;
				let Account = mongoose.model("Account");
				Account.findOne({address: address}).exec((err, doc) => {
					if(!err && doc)
						r_account.remark = doc.remark;
				});
				if(account.multisigInfo && account.multisigInfo.minCosignatories){
					r_account.minCosignatories = account.multisigInfo.minCosignatories;
				}
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
				res.json(r_account);
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
			if(!id)
				id = 0;
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
					if(item.transaction.type==4100 && item.transaction.otherTrans 
						&& !item.transaction.otherTrans.modifications){ //multisig transaction
						r_tx.timeStamp = item.transaction.otherTrans.timeStamp;
						r_tx.amount = item.transaction.otherTrans.amount?item.transaction.otherTrans.amount:0;
						r_tx.fee = item.transaction.otherTrans.fee;
						r_tx.sender = addressUtil.publicKeyToAddress(item.transaction.otherTrans.signer);
						r_tx.recipient = item.transaction.otherTrans.recipient;
					} else {
						r_tx.timeStamp = item.transaction.timeStamp;
						r_tx.amount = item.transaction.amount?item.transaction.amount:0;
						r_tx.fee = item.transaction.fee;
						r_tx.sender = addressUtil.publicKeyToAddress(item.transaction.signer);
						r_tx.recipient = item.transaction.recipient;
					}
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
	},

	/**
     * get mosaic transactions belong this account
     */
	detailMosaicTXList: (req, res, next) => {
		try{
			let address = req.body.address;
			let page = 1;
			if(req.body.page){
				page = parseInt(req.body.page);
			}
			address = address.replace(new RegExp(/(-)/g), '');
			let MosaicTransaction = mongoose.model('MosaicTransaction');
			MosaicTransaction.find({"$or":[{sender:address}, {recipient: address}]}).sort({timeStamp: -1}).skip(MOSIALISTSIZE*(page-1)).limit(MOSIALISTSIZE).exec((err, docs) => {
				if(err) {
					console.info(err);
					return res.json([]);
				}
				let r_mosaicArray = [];
				docs.forEach(mt => {
					if(!mt)
						return;
					let r_mosaic = {};
					r_mosaic.hash = mt.hash;
					r_mosaic.sender = mt.sender;
					r_mosaic.recipient = mt.recipient;
					r_mosaic.timeStamp = mt.timeStamp;
					r_mosaic.namespace = mt.namespace;
					r_mosaic.mosaic = mt.mosaic;
					r_mosaic.quantity = mt.quantity;
					r_mosaicArray.push(r_mosaic);
				});
				mosaicController.fixMosaicTXQuantity(r_mosaicArray, re => {
					res.json(r_mosaicArray);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * reload account info (in order to fix some invalid data of account)
     */
	reloadAccountInfo: (req, res, next) => {
		try {
			if(!cache || !cache.appCache || !cache.accountLastReloadTime){
				res.json({"message": "unable to use cache"});
				return;
			}
			cache.appCache.get(cache.accountLastReloadTime, (err, value) => {
				if(err){
					res.json({"message": "unable to use cache"});
					return;
				}
				if(value && (value+UPDATETIME > new Date().getTime())){
					res.json({"message": "this action only allow to be executed one time in 24 hours"});
					return;
				}
				cache.appCache.set(cache.accountLastReloadTime, new Date().getTime());
				init.reloadAccountInfo(1);
				res.json({"message": "success"});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * load harvested blocks
     */
	loadHarvestBlocks: (req, res, next) => {
		try {
			let address = req.body.address;
			nis.harvestByAddress(address, null, [], harvestData => {
				let dayTime = timeUtil.getTimeBeforeOneDayInNem();
				let monthTime = timeUtil.getTimeBeforeOneMonthInNem();
				let allBlocks = 0;
				let dayBlocks = 0;
				let monthBlocks = 0;
				let allFee = 0;
				let dayFee = 0;
				let monthFee = 0;
				for(let i in harvestData){
					allBlocks++;
					// for the harvested info in one day
					if(harvestData[i].timeStamp>dayTime){
						dayBlocks++;
						dayFee+=harvestData[i].totalFee;
					}
					// for the harvested info in one month
					if(harvestData[i].timeStamp>monthTime){
						monthBlocks++;
						monthFee+=harvestData[i].totalFee;
					}
					allFee+=harvestData[i].totalFee;
				}
				let r_harvest = {};
				r_harvest.allBlocks = allBlocks;
				r_harvest.dayBlocks = dayBlocks;
				r_harvest.monthBlocks = monthBlocks;
				r_harvest.allFee = Math.round(allFee/Math.pow(10,6));
				r_harvest.dayFee = Math.round(dayFee/Math.pow(10,6));
				r_harvest.monthFee = Math.round(monthFee/Math.pow(10,6));
				// load market info
				let market = cache.appCache.get(cache.marketPrefix);
				if(!market){
					res.json(r_harvest);
					return;
				}
				r_harvest.allBlocksPerFee = allFee==0?0:(r_harvest.allFee/allBlocks).toFixed(2);
				r_harvest.dayBlocksPerFee = dayFee==0?0:(r_harvest.dayFee/dayBlocks).toFixed(2);
				r_harvest.monthBlocksPerFee = monthBlocks==0?0:(r_harvest.monthFee/monthBlocks).toFixed(2);
				r_harvest.allBlocksPerFeeInUSD = allFee==0?0:(r_harvest.allFee/allBlocks * market.usd).toFixed(3);
				r_harvest.dayBlocksPerFeeInUSD = dayFee==0?0:(r_harvest.dayFee/dayBlocks * market.usd).toFixed(3);
				r_harvest.monthBlocksPerFeeInUSD = monthBlocks==0?0:(r_harvest.monthFee/monthBlocks * market.usd).toFixed(3);
				r_harvest.allBlocksPerFeeInBTC = allFee==0?0:(r_harvest.allFee/allBlocks * market.btc).toFixed(8);
				r_harvest.dayBlocksPerFeeInBTC = dayFee==0?0:(r_harvest.dayFee/dayBlocks * market.btc).toFixed(8);
				r_harvest.monthBlocksPerFeeInBTC = monthBlocks==0?0:(r_harvest.monthFee/monthBlocks * market.btc).toFixed(8);
				res.json(r_harvest);
			});
		} catch (e) {
			console.error(e);
		}
	}
}