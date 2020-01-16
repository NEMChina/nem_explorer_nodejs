import mongoose from 'mongoose';
import nis from '../utils/nisRequest';
import address from '../utils/address';
import message from '../utils/message';

const ROUNDAMOUNT = 10;

module.exports = {

	/**
     * get supernodes payout list
     */
	payoutList: (req, res, next) => {
		try {
			let round = req.body.round;
			if(!round){
				res.json([]);
				return
			}
			// query supernode info ( name <-> address )
			let Supernode = mongoose.model('Supernode');
			Supernode.find({}, {id:1, name: 1, payoutAddress: 1}).exec((err, supernodes) => {
				if(err || !supernodes){
					res.json([]);
					return;
				}
				let supernodeNameMap = new Map();
				let supernodeIDMap = new Map();
				for(let i in supernodes){
					if(!supernodes[i].id || !supernodes[i].name || !supernodes[i].payoutAddress){
						continue;
					}
					supernodeNameMap.set(supernodes[i].payoutAddress, supernodes[i].name);
					supernodeIDMap.set(supernodes[i].payoutAddress, supernodes[i].id);
				}
				let SupernodePayout = mongoose.model('SupernodePayout');
				SupernodePayout.find({round: round}).sort({timeStamp: 1}).exec((err, payouts) => {
					if(err || !payouts){
						res.json([]);
						return;
					}
					let r_payoutList = [];
					for(let i in payouts){
						let r_payout = {};
						r_payout.round = payouts[i].round;
						r_payout.sender = payouts[i].sender;
						r_payout.recipient = payouts[i].recipient;
						r_payout.amount = payouts[i].amount;
						r_payout.fee = payouts[i].fee;
						r_payout.timeStamp = payouts[i].timeStamp;
						if(supernodeNameMap.get(payouts[i].recipient))
							r_payout.supernodeName = supernodeNameMap.get(payouts[i].recipient);
						if(supernodeIDMap.get(payouts[i].recipient))
							r_payout.supernodeID = supernodeIDMap.get(payouts[i].recipient);
						r_payoutList.push(r_payout);
					}
					res.json(r_payoutList);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get supernodes payout list last 10 rounds
     */
	payoutListLast10Rounds: (req, res, next) => {
		try {
			let SupernodePayout = mongoose.model('SupernodePayout');
			let Supernode = mongoose.model('Supernode');
			Supernode.find({}, {id:1, name: 1, payoutAddress: 1}).exec((err, supernodes) => {
				if(err || !supernodes){
					res.json([]);
					return;
				}
				let supernodeNameMap = new Map();
				let supernodeIDMap = new Map();
				for(let i in supernodes){
					if(!supernodes[i].id || !supernodes[i].name || !supernodes[i].payoutAddress){
						continue;
					}
					supernodeNameMap.set(supernodes[i].payoutAddress, supernodes[i].name);
					supernodeIDMap.set(supernodes[i].payoutAddress, supernodes[i].id);
				}
				SupernodePayout.findOne().sort({round: -1}).exec((err, doc) => {
					if(err || !doc || !doc.round){
						res.json([]);
						return;
					}
					let conditions = [];
					for(let i=0;i<10;i++){
						if(doc.round-(i*4)<0)
							break;
						conditions.push({round: doc.round-(i*4)});
					}
					conditions = {"$or": conditions};
					SupernodePayout.find(conditions).sort({timeStamp: -1}).exec((err, payouts) => {
						if(err || !payouts){
							res.json([]);
							return;
						}
						let r_payoutList = [];
						for(let i in payouts){
							let r_payout = {};
							r_payout.round = payouts[i].round;
							r_payout.sender = payouts[i].sender;
							r_payout.recipient = payouts[i].recipient;
							r_payout.amount = payouts[i].amount;
							r_payout.fee = payouts[i].fee;
							r_payout.timeStamp = payouts[i].timeStamp;
							if(supernodeNameMap.get(payouts[i].recipient))
								r_payout.supernodeName = supernodeNameMap.get(payouts[i].recipient);
							if(supernodeIDMap.get(payouts[i].recipient))
								r_payout.supernodeID = supernodeIDMap.get(payouts[i].recipient);
							r_payoutList.push(r_payout);
						}
						res.json(r_payoutList);
					});
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get supernodes payout rounds list
     */
	payoutRoundList: (req, res, next) => {
		try {
			let SupernodePayout = mongoose.model('SupernodePayout');
			SupernodePayout.findOne().sort({round: -1}).exec((err, doc) => {
				if(err || !doc){
					res.json([]);
					return;
				}
				let r_payoutRoundList = [];
				let r_payoutRound = null;
				for(let i=0;i<10;i++){
					r_payoutRound = {};
					r_payoutRound.key = doc.round-3 + '-' + doc.round;
					r_payoutRound.value = doc.round;
					doc.round -= 4;
					r_payoutRoundList.push(r_payoutRound);
				}
				res.json(r_payoutRoundList);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get supernodes list
     */
	supernodeList: (req, res, next) => {
		try {
			let Supernode = mongoose.model('Supernode');
			Supernode.find({}).exec((err, docs) => {
				if(err || !docs){
					res.json([]);
					return;
				}
				let r_supernodeList = [];
				let r_supernode = null;
				for(let i in docs){
					if(!docs[i])
						return;
					r_supernode = {};
					r_supernode.id = docs[i].id;
					r_supernode.name = docs[i].name;
					r_supernode.payoutAddress = docs[i].payoutAddress;
					r_supernodeList.push(r_supernode);
				}
				res.json(r_supernodeList);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
	 * get supernodes selected payout list last 10 rounds
	 */

	selectedPayoutList10Rounds: (req, res, next) => {
		try {
			let supernodeName = req.body.supernodeName;
			
			let page = req.body.page - 1;
			if(!supernodeName){
				res.json([]);
				return
			}

			let supernodeNameArr = supernodeName.split(",");
			let SupernodePayout = mongoose.model('SupernodePayout');
			let Supernode = mongoose.model('Supernode');
			Supernode.find({"name":{"$in":supernodeNameArr}}).exec((err, supernodes) => {
				if(err || !supernodes){
					res.json([]);
					return;
				}
				let supernodeNameMap = new Map();
				let supernodeIDMap = new Map();
				for(let i in supernodes){
					if(!supernodes[i].id || !supernodes[i].name || !supernodes[i].payoutAddress){
						continue;
					}
					supernodeNameMap.set(supernodes[i].payoutAddress, supernodes[i].name);
					supernodeIDMap.set(supernodes[i].payoutAddress, supernodes[i].id);
				}
				SupernodePayout.findOne().sort({round: -1}).exec((err, doc) => {
					if(err || !doc || !doc.round){
						res.json([]);
						return;
					}
					let conditions = [];
					for(let i=0+10*page;i<(10+10*page);i++){
						if(doc.round-(i*4)<0)
							break;
						conditions.push({round: doc.round-(i*4)});
					}
					conditions = {"$or": conditions};
					SupernodePayout.find(conditions).sort({timeStamp: -1}).exec((err, payouts) => {
						
						if(err || !payouts){
							res.json([]);
							return;
						}
						let r_payoutList = [];
						for(let i in payouts){
							let r_payout = {};
							r_payout.round = payouts[i].round;
							r_payout.sender = payouts[i].sender;
							r_payout.recipient = payouts[i].recipient;
							r_payout.amount = payouts[i].amount;
							r_payout.fee = payouts[i].fee;
							r_payout.timeStamp = payouts[i].timeStamp;
							if(supernodeNameMap.get(payouts[i].recipient))
								r_payout.supernodeName = supernodeNameMap.get(payouts[i].recipient);
							if(supernodeIDMap.get(payouts[i].recipient)){
								r_payout.supernodeID = supernodeIDMap.get(payouts[i].recipient);
								r_payoutList.push(r_payout);
							}
								
						}
						res.json(r_payoutList);
					});
				});
			});
		} catch (e) {
			console.error(e);
		}
	}


}