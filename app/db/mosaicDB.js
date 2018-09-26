import mongoose from 'mongoose';

/**
 * save mosaic into DB
 */
let saveMosaic = (m) => {
	let Mosaic = mongoose.model('Mosaic');
	new Mosaic(m).save(err => {
		if(err)
			log('<error> Block [' + m.height + '] save Mosaic [' + m.mosaicName + '] : ' + err);
		else
			log('<success> Block [' + m.height + '] save Mosaic [' + m.mosaicName + ']');
	});
};

/**
 * update mosaic into DB
 */
let updateMosaic = (m) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.update({mosaicName:m.mosaicName, namespace:m.namespace}, m, err => {
		if(err)
			log('<error> Block [' + m.height + '] save Mosaic [' + m.mosaicName + '] : ' + err);
		else
			log('<success> Block [' + m.height + '] save Mosaic [' + m.mosaicName + ']');
	});
};

/**
 * save or update mosaic into DB
 */
let saveOrUpdateMosaic = (m) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.update({mosaicName:m.mosaicName, namespace:m.namespace, timeStamp: {$lt: m.timeStamp}}, m, {upsert : true}, err => {
		if(err)
			log('<error> Block [' + m.height + '] save Mosaic [' + m.mosaicName + '] : ' + err);
		else
			log('<success> Block [' + m.height + '] save Mosaic [' + m.mosaicName + ']');
	});
};

/**
 * find one mosaic by mosaic name and namespace
 */
let findOneMosaic = (mosaic, namespace, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.findOne({mosaicName: mosaic, namespace: namespace}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

/**
 * find mosaics by multiple mosaic name and namespace
 */
let findMosaics = (params, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.find({$or: params}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else 
			callback(docs);
	});
};

/**
 * get mosaic list by namespace
 */
let mosaicListByNamespace = (ns, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.find({namespace: ns}).sort({timeStamp: -1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

/**
 * get mosaic list
 */
let mosaicList = (no, limit, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	let params = {};
	if(no)
		params.no = {$lt: no};
	Mosaic.find(params).sort({timeStamp: -1, no: -1}).limit(limit).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

/**
 * get mosaic transfer list
 */
let mosaicTransferList = (m, ns, no, limit, callback) => {
	let MosaicTransaction = mongoose.model('MosaicTransaction');
	let params = {};
	if(m && ns)
		params = {mosaic:m, namespace: ns};
	if(no)
		params.no = {$lt: no};
	MosaicTransaction.find(params).sort({timeStamp: -1, no: -1}).limit(limit).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

/**
 * query one mosaic info by mosaic name and namespace from DB
 */
let findOneMosaicByMosaicNameAndNamespace = (mosaicName, namespace, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.findOne({mosaicName: mosaicName, namespace: namespace}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

/**
 * update mosaic supply field
 */
let updateMosaicSupply = (mosaicName, namespace, timeStamp, change, height) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.update({mosaicName: mosaicName, namespace: namespace, timeStamp: {$lt: timeStamp}}, {$inc: {initialSupply: change}}, (err, doc) => {
		if(err) 
			log('<error> Block [' + height + '] update Mosaic ['+mosaicName+'] : ' + err);
	});
};

/**
 * save or update account mosaic
 */
let saveOrUpdateAccountMosaic = (accountMosaic, height) => {
	let AccountMosaic = mongoose.model('AccountMosaic');
	AccountMosaic.update({address: accountMosaic.address, mosaicID: accountMosaic.mosaicID}, accountMosaic, {upsert : true}, err => {
		if(err)
			log('<error> Block [' + height + '] upsert Account [' + accountMosaic.address + '] Mosaic [' + accountMosaic.mosaicID + '] : ' + err);
	});
};

/**
 * reset account mosaic
 */
let resetAccountMosaic = (address, height, callback) => {
	let AccountMosaic = mongoose.model('AccountMosaic');
	let params = {address: address};
	AccountMosaic.updateMany(params, {quantity: 0}, err => {
		if(err) 
			log('<error> Block [' + height + '] update mosaics to 0 : ' + err);
		callback();
	});
};

/**
 * query mosaic rich list
 */
let getMosaicRichList = (mosaicID, limit, skip, callback) => { 
	let AccountMosaic = mongoose.model('AccountMosaic');
	let params = {mosaicID: mosaicID};
	AccountMosaic.find(params).sort({quantity:-1}).limit(limit).skip(skip).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

let log = (message) => {
	console.info(message);
};

module.exports = {
	findOneMosaic,
	findMosaics,
	saveMosaic,
	updateMosaic,
	saveOrUpdateMosaic,
	mosaicListByNamespace,
	mosaicList,
	mosaicTransferList,
	findOneMosaicByMosaicNameAndNamespace,
	updateMosaicSupply,
	saveOrUpdateAccountMosaic,
	resetAccountMosaic,
	getMosaicRichList
}