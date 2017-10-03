import mongoose from 'mongoose';

let BlockSchema = new mongoose.Schema({
	height: {type: Number, required: true, unique: true},
	timeStamp: {type: Number, required: true, index: true}
});

//init Poll Schema
mongoose.model('Block', BlockSchema);