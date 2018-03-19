import mongoose from 'mongoose';

/**
 * query one namespace info from DB
 */
let findOneNamespace = (namespace, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.findOne({namespace: namespace.namespace}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

/**
 * query one namespace info by Name from DB
 */
let findOneNamespaceByName = (name, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.findOne({namespace: name}).exec((err, doc) => {
		if(err || !doc)
			callback(null);
		else 
			callback(doc);
	});
};

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
};

/**
 * update namespace expired field
 */
let updateNamespaceExpiredTime = (namespace, expiredTime) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.update({namespace: namespace.namespace}, {expiredTime: expiredTime}, (err, doc) => {
		if(err) 
			log('<error> Block [' + namespace.height + '] renew NS ['+namespace.namespace+'] : ' + err);
	});
};

/**
 * update namespace mosaics field
 */
let updateNamespaceMosaics = (namespace, height) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.update({namespace: namespace}, {$inc: {mosaics: 1}}, (err, doc) => {
		if(err) 
			log('<error> Block [' + height + '] update NS ['+namespace+'] mosaic : ' + err);
	});
};

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
};

/**
 * get root namspace list
 */
let rootNamespaceList = (no, limit, callback) => {
	let Namespace = mongoose.model('Namespace');
	let params = {$where: "this.namespace==this.rootNamespace"};
	if(no)
		params.no = {$lt: no};
	Namespace.find(params).sort({timeStamp: -1, no: -1}).limit(limit).exec((err, docs) => {
		if(err || !docs)
			callback([]);
		else
			callback(docs);
	});
};

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
};

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
};

/**
 * get namespace and sub namespace list by Root namespace
 */
let namespaceListbyRoot = (ns, callback) => {
	let Namespace = mongoose.model('Namespace');
	Namespace.find({rootNamespace: ns}).sort({namespace: 1}).exec((err, docs) => {
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
	findOneNamespace,
	findOneNamespaceByName,
	saveNamespace,
	updateNamespaceExpiredTime,
	updateNamespaceMosaics,
	updateRootNamespace,
	rootNamespaceList,
	subNamespaceList,
	namespaceListbyNamespace,
	namespaceListbyRoot
}