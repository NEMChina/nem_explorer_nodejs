import mongoose from 'mongoose';

let TransactionSchema = new mongoose.Schema({
	hash: {type: String, index: true, unique: true},
	height: {type: Number, index: true, required: true},
	sender: {type: String, index: true},
	recipient: {type: String, index: true},
	amount: {type: Number, required: true},
	fee: {type: Number, required: true},
	timeStamp: {type: Number, index:true, required: true},
	deadline: {type: Number, required: true},
	signature: {type: String, required: true},
	type: {type: Number, index: true, required: true},
	apostilleFlag: {type: Number, index: true},
	mosaicTransferFlag: {type: Number, index: true},
	aggregateFlag: {type: Number, index: true}
});

TransactionSchema.index({height: -1, timeStamp: -1});

//init Transaction Schema
mongoose.model('Transaction', TransactionSchema);