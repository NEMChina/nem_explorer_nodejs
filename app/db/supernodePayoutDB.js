import mongoose from 'mongoose';

/**
 * save supernode payout into DB
 */
let saveSupernodePayout = (payout) => {
	let SupernodePayout = mongoose.model('SupernodePayout');
	new SupernodePayout(payout).save(err => { });
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	saveSupernodePayout
}