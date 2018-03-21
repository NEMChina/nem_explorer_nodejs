import namespaceDB from '../db/namespaceDB';
import nis from '../utils/nisRequest';
import mosaicController from '../controllers/mosaic.server.controller';

const LISTSIZE = 100;
const namespaceListLimit = 50;

module.exports = {

	/**
     * get root namespace list
     */
	rootNamespaceList: (req, res, next) => {
		try {
			let no = req.body.no;
			// validate no
			let reg_no = /^[0-9]+$/;
			if(!no || !reg_no.test(no))
				no = null;
			namespaceDB.rootNamespaceList(no, namespaceListLimit, docs => {
				docs.forEach((item, index) => {
					item.subNamespaces = item.subNamespaces?item.subNamespaces:"";
				});
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get root namespace by namespace
     */
	rootNamespaceByNamespace: (req, res, next) => {
		try {
			let ns = req.body.ns;
			// validate namespace
			let reg = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!reg.test(ns)){
				res.json([]);
				return;
			}
			// check namspace exists
			namespaceDB.findOneNamespaceByName(ns, doc => {
				if(!doc){
					res.json([]);
					return;
				}
				let rootNamespace = ns;
				if(ns.indexOf(".")!=-1)
					rootNamespace = rootNamespace.substring(0, rootNamespace.indexOf("."));
				namespaceDB.findOneNamespaceByName(rootNamespace, doc => {
					if(!doc)
						res.json([]);
					else 
						res.json([doc]);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get sub namespace list by root namespace
     */
	subNamespaceList: (req, res, next) => {
		try {
			let rootNamespace = req.body.root;
			// validate rootNamespace
			let reg = /^([a-zA-Z0-9_-])+$/;
			if(!reg.test(rootNamespace)){
				res.json([]);
				return;
			}
			namespaceDB.subNamespaceList(rootNamespace, docs => {
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get namespace and sub namespace list
     */
	namespaceListbyNamespace: (req, res, next) => {
		try {
			let namespace = req.body.ns;
			// validate rootNamespace
			let reg = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!reg.test(namespace)){
				res.json([]);
				return;
			}
			// get root namespace
			let rootNamespace = namespace.substring(namespace.indexOf(".")+1);
			namespaceDB.namespaceListbyRoot(rootNamespace, docs => {
				let newDocs = [];
				docs.forEach(doc => {
					if(doc.namespace.length>=namespace.length)
						newDocs.push(doc);
				});
				res.json(newDocs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get namespace list which the address own
     */
	namespaceListByAddress: (req, res, next) => {
		try {
			let address = req.body.address;
			address = address.replace(new RegExp(/(-)/g), '');
			if(!address){
				res.json([]);
				return;
			}
			nis.namespaceListByAddress(address, data => {
				if(!data || !data.data){
					res.json([]);
					return;
				}
				let r_namespaceList = [];
				let r_namespace = null;
				for(let i in data.data){
					r_namespace = {};
					r_namespace.namespace = data.data[i].fqn;
					r_namespace.height = data.data[i].height;
					r_namespaceList.push(r_namespace);
				}
				res.json(r_namespaceList);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic list which the address own
     */
	mosaicListByAddress: (req, res, next) => {
		try {
			let address = req.body.address;
			if(!address){
				res.json([]);
				return;
			}
			address = address.replace(new RegExp(/(-)/g), '');
			nis.mosaicListByAddress(address, data_mosaic => {
				if(!data_mosaic || !data_mosaic.data){
					res.json([]);
					return;
				}
				let r_mosaicList = [];
				let r_mosaic = null;
				for(let i in data_mosaic.data){
					if(data_mosaic.data[i].mosaicId.namespaceId=="nem")
						continue;
					r_mosaic = {};
					r_mosaic.mosaic = data_mosaic.data[i].mosaicId.name;
					r_mosaic.quantity = data_mosaic.data[i].quantity;
					r_mosaic.namespace = data_mosaic.data[i].mosaicId.namespaceId;
					r_mosaic.id = data_mosaic.data[i].mosaicId.name;
					r_mosaicList.push(r_mosaic);
				}
				mosaicController.setMosaicTXDivisibility(r_mosaicList, mosaicTXs => {
					res.json(mosaicTXs);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic list which the namespace own
     */
	mosaicListByNamespace: (req, res, next) => {
		try {
			let namespace = req.body.namespace;
			if(!namespace){
				res.json([]);
				return;
			}
			// validate namespace
			let reg = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!reg.test(namespace)){
				res.json([]);
				return;
			}
			nis.allMosaicDefinitionListByNamespace(namespace, null, [], data => {
				if(!data){
					res.json([]);
					return;
				}
				let r_mosaicList = [];
				let r_mosaic = null;
				for(let index in data) {
					let mosaic = data[index];
					r_mosaic = {};
					r_mosaic.no = parseInt(index)+1;
					r_mosaic.name = mosaic.mosaic.id.name;
					if(mosaic.mosaic && mosaic.mosaic.properties){
						mosaic.mosaic.properties.forEach(property => {
							if(property.name=='initialSupply')
								r_mosaic.initialSupply = property.value;
							if(property.name=='transferable')
								r_mosaic.transferable = property.value;
							if(property.name=='divisibility')
								r_mosaic.divisibility = property.value;
						});
					}
					r_mosaicList.push(r_mosaic);
				}
				res.json(r_mosaicList);
			});
		} catch (e) {
			console.error(e);
		}
	}
}