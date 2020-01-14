import mongoose from 'mongoose';

/**
 * save mosaic transaction into DB by batch
 */
let saveMosaicTransactionByBatch = (mosaicTxArr, height) => {
	let MosaicTransaction = mongoose.model('MosaicTransaction');
	MosaicTransaction.insertMany(mosaicTxArr, err => {
		// if(err)
		// 	log('<error> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + '] : ' + err);
		// else
		// 	log('<success> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + ']');
	});
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	saveMosaicTransactionByBatch
}