import mongoose from 'mongoose';

let SupernodePayoutAccountSchema = new mongoose.Schema({
	round: {type: Number, required: true, index: true},
	sender: {type: String, required: true},
	recipient: {type: String, required: true},
	amount: {type: Number, required: true},
	fee: {type: Number, required: true},
	timeStamp: {type: Number, required: true, index: true}
});

//init SupernodePayout Schema
mongoose.model('SupernodePayout', SupernodePayoutAccountSchema);