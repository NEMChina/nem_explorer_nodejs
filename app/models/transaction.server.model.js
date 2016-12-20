import mongoose from 'mongoose';

let TransactionSchema = new mongoose.Schema({
	hash: {type: String, index: true, unique: true},
	height: {type: Number, index: true, required: true},
	sender: String,
	recipient: String,
	amount: {type: Number, required: true},
	fee: {type: Number, required: true},
	timeStamp: {type: Number, index:true, required: true},
	deadline: {type: Number, required: true},
	signature: {type: String, required: true},
	type: {type: Number, required: true}
});

TransactionSchema.index({height: -1, timeStamp: -1});

//init Transaction Schema
mongoose.model('Transaction', TransactionSchema);