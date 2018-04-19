import mongoose from 'mongoose';

let ErrorMessageSchema = new mongoose.Schema({
	message: {type: String, required: true},
});

//init Error Schema
mongoose.model('ErrorMessage', ErrorMessageSchema);