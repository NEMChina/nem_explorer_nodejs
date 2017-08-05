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
			Supernode.find({}, {name: 1, payoutAddress: 1}).exec((err, supernodes) => {
				if(err || !supernodes){
					res.json([]);
					return;
				}
				let supernodeMap = new Map();
				for(let i in supernodes){
					if(!supernodes[i].name || !supernodes[i].payoutAddress){
						continue;
					}
					supernodeMap.set(supernodes[i].payoutAddress, supernodes[i].name);
				}
				let SupernodePayout = mongoose.model('SupernodePayout');
				SupernodePayout.find({round: round}).sort({timeStamp: 1}).exec((err, payouts) => {
					if(err || !payouts){
						res.json([]);
						return;
					}
					for(let i in payouts){
						if(supernodeMap.get(payouts[i].recipient))
							payouts[i].supernodeName = supernodeMap.get(payouts[i].recipient);
					}
					res.json(payouts);
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
	}
}