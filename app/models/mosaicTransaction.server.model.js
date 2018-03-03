import mongoose from 'mongoose';

let MosaicTransactionSchema = new mongoose.Schema({
	hash: {type: String, required: true},
	no: {type: Number, required: true, unique: true},
	sender: {type: String, required: true},
	recipient: {type: String, required: true},
	namespace: {type: String, index: true, required: true},
	mosaic: {type: String, index: true, required: true},
	quantity: {type: Number, required: true},
	timeStamp: {type: Number, index: true, required: true},
});

//init Transaction Schema
mongoose.model('MosaicTransaction', MosaicTransactionSchema);