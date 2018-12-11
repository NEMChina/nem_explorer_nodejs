import mongoose from 'mongoose';

let PollIndexSchema = new mongoose.Schema({
	creator: {type: String, required: true},
	address: {type: String, required: true},
	title: {type: String, required: true},
	type: {type: Number, required: true},
	doe: {type: Number, required: true},
});

//init PollIndex Schema
mongoose.model('PollIndex', PollIndexSchema);