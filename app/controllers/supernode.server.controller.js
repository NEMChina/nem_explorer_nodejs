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
			let SupernodePayout = mongoose.model('SupernodePayout');
			SupernodePayout.find({round: round}).sort({timeStamp: 1}).exec((err, doc) => {
				if(err){
					res.json([]);
					return;
				}
				res.json(doc);
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