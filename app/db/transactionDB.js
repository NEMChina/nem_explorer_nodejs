import mongoose from 'mongoose';

/**
 * save transaction into DB
 */
let saveTransaction = (saveTx, index, callback) => {
	let Transaction = mongoose.model('Transaction');
	new Transaction(saveTx).save(err => {
		if(err){
			log('<error> Block ['+saveTx.height+'] save TX [' + index + '] : ' + err);
			callback(false);
		} else{
			log('<success> Block ['+saveTx.height+'] save TX [' + index + ']');
			callback(true);
		}
	});
};

/**
 * save transaction into DB by batch (Nemesis Block)
 */
let saveTransactionByBatchNemesis = (saveTxArr) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.insertMany(saveTxArr, err => {
		if(err)
			log('<error> Block [1] create TXs all [' + saveTxArr.length + '] : ' + err);
		else
			log('<success> Block [1] create TXs all [' + saveTxArr.length + ']');
	});
};

/**
 * query max block height from DB
 */
let findOneTransactionSortHeight = (callback) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.findOne().sort('-height').exec((err, doc) => {
		if(err || !doc){
			log('<error> query max height from DB: ' + err);
			callback(null);
		} else {
			callback(doc);
		}
	});
};

/**
 * find one transaction by Hash
 */
let findOneTransaction = (hash, callback) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.findOne({hash: hash}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

/**
 * query transactions by address
 */
let transactionsByAddress = (address, size, page, callback) => {
	let Transaction = mongoose.model('Transaction');
	let params = {"$or":[{sender:address}, {recipient: address}]};
	let limit = null;
	let skip = null;
	if(size)
		limit = size;
	if(page && size)
		skip = size * (page-1);
	Transaction.find(params).skip(skip).limit(limit).sort({timeStamp: -1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else 
			callback(docs);
	});
};

/**
 * query transactions by block height
 */
let transactionsByHeight = (height, callback) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.find({height: height}).sort({timeStamp: -1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else 
			callback(docs);
	});
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	saveTransaction,
	saveTransactionByBatchNemesis,
	findOneTransactionSortHeight,
	findOneTransaction,
	transactionsByAddress,
	transactionsByHeight
}