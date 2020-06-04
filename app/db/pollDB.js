import mongoose from 'mongoose';

/**
 * find all poll address
 */
let findAllPollAddress = (callback) => {
	let PollIndex = mongoose.model('PollIndex');
	PollIndex.find({}, {address: 1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

/**
 * save poll index into DB
 */
let savePollIndex = (pollIndex) => {
	let PollIndex = mongoose.model('PollIndex');
	new PollIndex(pollIndex).save(err => { });
};

/**
 * save poll index array into DB
 */
let savePollIndexArray = (pollIndexArr) => {
	pollIndexArr.forEach((polldata,i) => {
		savePollIndex(polldata);
	});
	
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	findAllPollAddress,
	savePollIndex,
	savePollIndexArray
}