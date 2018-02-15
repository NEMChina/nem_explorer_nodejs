import mongoose from 'mongoose';

/**
 * save block into DB
 */
let saveBlock = (saveBlock) => {
	let Block = mongoose.model('Block');
	let nowTime = new Date().getTime();
	new Block(saveBlock).save(err => {
		if(err)
			log('<error> Block [' + saveBlock.height + '] save block : ' + err);
	});
}

/**
 * save transaction into DB
 */
let saveTransaction = (saveTx, index) => {
	let Transaction = mongoose.model('Transaction');
	new Transaction(saveTx).save(err => {
		if(err)
			log('<error> Block ['+saveTx.height+'] save TX [' + index + '] : ' + err);
		else
			log('<success> Block ['+saveTx.height+'] save TX [' + index + ']');
	});
}

/**
 * save transaction into DB by batch (Nemesis Block)
 */
let saveTransactionByBatchNemesis = (saveTxArr) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.insertMany(saveTxArr, err => {
		if(err)
			log('<error> Block [1] create TXs all [' + saveTxArr.length + '] : ' + err);
		else
			log('<success> Block [1] create TXs all [' + saveTxArr.length + ']');
	});
}

/**
 * query max block height from DB
 */
let findOneTransactionSortHeight = (callback) => {
	let Transaction = mongoose.model('Transaction');
	Transaction.findOne().sort('-height').exec((err, doc) => {
		if(err || !doc){
			log('<error> query max height from DB: ' + err);
			callback(null);
		} else {
			callback(doc);
		}
	});
}

/**
 * query one account info from DB
 */
let findOneAccount = (address, callback) => {
	let Account = mongoose.model('Account');
	Account.findOne({address: address}, (err, doc) => {
		if(err || !doc)
			return callback(null);
		else
			return callback(doc);
	});
}

/**
 * save account into DB
 */
let saveAccount = (account) => {
	let Account = mongoose.model('Account');
	new Account(account).save((err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] save ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] save ['+account.address+']');
	});
}

/**
 * update account info
 */
let updateAccount = (account) => {
	let Account = mongoose.model('Account');
	Account.update({address: account.address}, account, (err, doc) => {
		if(err)
			log('<error> Block [' + account.height + '] update ['+account.address+']: ' + err);
		else
			log('<success> Block [' + account.height + '] update ['+account.address+']');
	});
}

/**
 * query one account remark info from DB
 */
let findOneAccountRemark = (account, callback) => {
	let AccountRemark = mongoose.model('AccountRemark');
	AccountRemark.findOne({address: account.address}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else
			return callback(doc);
	});
}

/**
 * save mosaic transaction into DB by batch
 */
let saveMosaicTransactionByBatch = (mosaicTxArr, height) => {
	let MosaicTransaction = mongoose.model('MosaicTransaction');
	MosaicTransaction.insertMany(mosaicTxArr, err => {
		if(err)
			log('<error> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + '] : ' + err);
		else
			log('<success> Block [' + height + '] found TX(M) count [' + mosaicTxArr.length + ']');
	});
}

/**
 * query one namespace info from DB
 */
let findOneNamespace = (namespace, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.findOne({namespace: namespace.namespace}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

/**
 * query one namespace info by Name from DB
 */
let findOneNamespaceByName = (name, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.findOne({namespace: name}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

/**
 * save namespace into DB
 */
let saveNamespace = (namespace) => {
	let Namespace = mongoose.model('Namespace');
	new Namespace(namespace).save(err => {
		if(err)
			log('<error> Block [' + namespace.height + '] save NS [' + namespace.namespace + '] : ' + err);
		else
			log('<success> Block [' + namespace.height + '] save NS [' + namespace.namespace + ']');
	});
}

/**
 * update namespace expired field
 */
let updateNamespaceExpiredTime = (namespace, expiredTime) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.update({namespace: namespace.namespace}, {expiredTime: expiredTime}, (err, doc) => {
		if(err) 
			log('<error> Block [' + namespace.height + '] renew NS ['+namespace.namespace+'] : ' + err);
	});
}

/**
 * update namespace mosaics field
 */
let updateNamespaceMosaics = (namespace, height) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.update({namespace: namespace}, {$inc: {mosaics: 1}}, (err, doc) => {
		if(err) 
			log('<error> Block [' + height + '] update NS ['+namespace+'] mosaic : ' + err);
	});
}

/**
 * update root namespace (update the 'subNamespaces' field)
 */
let updateRootNamespace = (namespace) => {
	let Namespace = mongoose.model('Namespace');
	findOneNamespaceByName(namespace.rootNamespace, doc => {
		if(!doc)
			return;
		let subNamespaces = doc.subNamespaces?doc.subNamespaces:"";
		subNamespaces += namespace.namespace + " ";
		Namespace.update({namespace: doc.namespace}, {subNamespaces: subNamespaces}, (err, doc) => {
			if(err) 
				log('<error> Block [' + namespace.height + '] renew NS ['+namespace.namespace+'] : ' + err);
		});
	});
}

/**
 * get root namspace list
 */
let rootNamespaceList = (callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.find({$where: "this.namespace==this.rootNamespace"}).sort({timeStamp: -1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
}

/**
 * get sub namspace list by root namespace
 */
let subNamespaceList = (rootNamespace, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.find({rootNamespace: rootNamespace}).sort({timeStamp: -1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
}

/**
 * get namespace and sub namespace list
 */
let namespaceListbyNamespace = (ns, callback) => {
	let Namespace = mongoose.model('Namespace');
	let regex = "^" + ns;
	Namespace.find({namespace: {$regex: regex}}).sort({namespace: 1}).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
}

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
}

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
}

/**
 * find one mosaic by mosaic name and namespace
 */
let findOneMosaic = (mosaic, namespace, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.findOne({mosaicName: mosaic, namespace, namespace}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

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
}

/**
 * query one mosaic info by mosaic name and namespace from DB
 */
let findOneMosaicByMosaicNameAndNamespace = (mosaicName, namespace, callback) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.findOne({mosaicName: mosaicName, namespace: namespace}).exec((err, doc) => {
		if(err || !doc)
			return callback(null);
		else 
			return callback(doc);
	});
}

/**
 * update mosaic supply field
 */
let updateMosaicSupply = (mosaicName, namespace, supply, height) => {
	let Mosaic = mongoose.model('Mosaic');
	Mosaic.update({mosaicName: mosaicName, namespace: namespace}, {initialSupply: supply}, (err, doc) => {
		if(err) 
			log('<error> Block [' + height + '] update Mosaic ['+mosaicName+'] : ' + err);
	});
}

/**
 * save supernode payout into DB
 */
let saveSupernodePayout = (payout) => {
	let SupernodePayout = mongoose.model('SupernodePayout');
	new SupernodePayout(payout).save(err => { });
}

/**
 * log util
 */
let log = (message) => {
	console.info(message);
};

module.exports = {
	saveBlock,
	saveTransaction,
	saveTransactionByBatchNemesis,
	findOneTransactionSortHeight,
	findOneAccount,
	saveAccount,
	updateAccount,
	findOneAccountRemark,
	saveMosaicTransactionByBatch,
	findOneNamespace,
	findOneNamespaceByName,
	saveNamespace,
	updateNamespaceExpiredTime,
	updateNamespaceMosaics,
	updateRootNamespace,
	rootNamespaceList,
	subNamespaceList,
	namespaceListbyNamespace,
	findOneMosaic,
	saveMosaic,
	updateMosaic,
	mosaicListByNamespace,
	findOneMosaicByMosaicNameAndNamespace,
	updateMosaicSupply,
	saveSupernodePayout
}