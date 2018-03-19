import mongoose from 'mongoose';

/**
 * save block into DB
 */
let saveBlock = (saveBlock) => {
	let Block = mongoose.model('Block');
	new Block(saveBlock).save(err => {
		if(err)
			log('<error> Block [' + saveBlock.height + '] save block : ' + err);
	});
};

/**
 * find one Block by height
 */
let findOneBlock = (height, callback) => {
	let Block = mongoose.model('Block');
	Block.findOne({height: height}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	saveBlock,
	findOneBlock
}