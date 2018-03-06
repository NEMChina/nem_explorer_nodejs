import mongoose from 'mongoose';

let NamespaceSchema = new mongoose.Schema({
	namespace: {type: String, required: true, unique: true},
	rootNamespace: {type: String},
	creator: {type: String, required: true},
	height: {type: Number, required: true},
	timeStamp: {type: Number, required: true},
	expiredTime: {type: Number, required: true},
	subNamespaces: {type: String}, 
	mosaicNames: {type: String},
});

//init Namespace Schema
mongoose.model('Namespace', NamespaceSchema);