import mongoose from 'mongoose';

let MosaicSchema = new mongoose.Schema({
	mosaicName: {type: String, required: true},
	namespace: {type: String, required: true},
	divisibility: {type: Number, required: true},
	initialSupply: {type: Number, required: true},
	supplyMutable: {type: Number, required: true},
	transferable: {type: Number, required: true},
	timeStamp: {type: Number, required: true},
	creator: {type: String, required: true},
	height: {type: Number, required: true}
});

//init Mosaic Schema
mongoose.model('Mosaic', MosaicSchema);