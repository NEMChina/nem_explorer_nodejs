import mongoose from 'mongoose';

let AccountMosaicSchema = new mongoose.Schema({
	address: {type: String, required: true, index: true},
	mosaicID: {type: String, required: true, index: true},
	quantity: {type: Number, required: true}
});

//init Account Mosaic Schema
mongoose.model('AccountMosaic', AccountMosaicSchema);