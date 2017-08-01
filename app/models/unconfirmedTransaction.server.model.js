import mongoose from 'mongoose';

let UnconfirmedTransactionSchema = new mongoose.Schema({
	signature: {type: String, index:true, required: true},
	timeStamp: {type: Number, index:true, required: true},
	deadline: {type: Number, required: true},
	otherHash: {type: String},
	detail: {type: String, required: true}
});

//init UnconfirmedTransaction Schema
mongoose.model('UnconfirmedTransaction', UnconfirmedTransactionSchema);