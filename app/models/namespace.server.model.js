import mongoose from 'mongoose';

let NamespaceSchema = new mongoose.Schema({
	name: {type: String, required: true, unique: true},
	mosaics: {type: Number, required: true, default: 0},
	timeStamp: {type: Number, required: true},
	height: {type: Number, required: true},
	creator: String,
	mosaicNames: String
});

//init Namespace Schema
mongoose.model('Namespace', NamespaceSchema);