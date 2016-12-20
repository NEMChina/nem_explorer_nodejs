import mongoose from 'mongoose';

let AccountSchema = new mongoose.Schema({
	address: {type: String, index: true, required: true, unique: true},
	publicKey: {type: String, index: true},
	balance: {type: Number, default: 0, index: true},
	blocks: {type: Number, default: 0, index: true},
	lastBlock: {type: Number, default: 0},
	fees: {type: Number, default: 0},
	timeStamp: {type: Number, default: 0},
	label: String
});

//init Account Schema
mongoose.model('Account', AccountSchema);