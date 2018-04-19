import mongoose from 'mongoose';

/**
 * save error message info from DB
 */
let saveError = (message, callback) => {
	let ErrorMessage = mongoose.model('ErrorMessage');
	new ErrorMessage({message: message}).save(err => { });
};

module.exports = {
	saveError
}