import mongoose from 'mongoose';

let AccountMosaicSchema = new mongoose.Schema({
	address: {type: String, required: true},
	mosaicID: {type: String, required: true},
	quantity: {type: Number, required: true}
});

//init Account Mosaic Schema
mongoose.model('AccountMosaic', AccountMosaicSchema);