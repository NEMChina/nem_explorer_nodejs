import mongoose from 'mongoose';

let NamespaceSchema = new mongoose.Schema({
	name: {type: String, required: true},
	rootName: {type: String},
	creator: {type: String, required: true},
	height: {type: Number, required: true},
	timeStamp: {type: Number, required: true},
	expiredTime: {type: Number, required: true},
	subNamespaces: {type: String}, 
	mosaics: {type: Number, required: true, default: 0},
	mosaicNames: {type: String},
});

//init Namespace Schema
mongoose.model('Namespace', NamespaceSchema);