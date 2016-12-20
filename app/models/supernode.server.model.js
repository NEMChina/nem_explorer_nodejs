import mongoose from 'mongoose';

let SupernodeSchema = new mongoose.Schema({
	id: {type: Number, required: true},
	host: {type: String, required: true},
	name: {type: String, required: true},
	time: {type: String, required: true}
});

//init Supernode Schema
mongoose.model('Supernode', SupernodeSchema);