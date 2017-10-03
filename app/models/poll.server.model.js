import mongoose from 'mongoose';

let PollSchema = new mongoose.Schema({
	timeStamp: {type: Number, required: true},
	creator: {type: String, required: true},
	address: {type: String, required: true},
	title: {type: String, required: true},
	description: {type: String},
	type: {type: Number, required: true},
	multiple: {type: Number, required: true},
	doe: {type: Number, required: true},
	strings: {type: String, required: true},
	addresses: {type: String, required: true},
	whitelist: {type: String}
});

//init Poll Schema
mongoose.model('Poll', PollSchema);