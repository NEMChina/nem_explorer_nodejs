import mongoose from 'mongoose';

let MosaicSchema = new mongoose.Schema({
	mosaicID: {type: String, required: true, unique: true},
	mosaicName: {type: String, required: true},
	namespace: {type: String, required: true},
	description: {type: String},
	divisibility: {type: Number},
	initialSupply: {type: Number},
	supplyMutable: {type: Number},
	transferable: {type: Number},
	levyType: {type: Number},
	levyRecipient: {type: String},
	levyNamespace: {type: String},
	levyMosaic: {type: String},
	levyFee: {type: Number},
	creator: {type: String, required: true},
	timeStamp: {type: Number, required: true},
	height: {type: Number, required: true},
	no: {type: Number, required: true, unique: true}
});

//init Mosaic Schema
mongoose.model('Mosaic', MosaicSchema);