import mongoose from 'mongoose';
import dbUtil from '../utils/dbUtil';
import nis from '../utils/nisRequest';

const LISTSIZE = 100;

module.exports = {

	/**
     * get root namespace list
     */
	rootNamespaceList: (req, res, next) => {
		try {
			dbUtil.rootNamespaceList(docs => {
				let r_namespaceList = [];
				let r_namespace = null;
				let preCount = 0;
				let executedCount = 0;
				docs.forEach((namespace, namespaceIndex) => {
					r_namespace = {};
					r_namespace.namespace = namespace.namespace;
					r_namespace.creator = namespace.creator;
					r_namespace.timeStamp = namespace.timeStamp;
					r_namespace.expiredTime = namespace.expiredTime;
					r_namespace.subNamespaces = namespace.subNamespaces?namespace.subNamespaces:"";
					r_namespaceList.push(r_namespace);
				});
				res.json(r_namespaceList);
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
			let req = /^([a-zA-Z0-9_-])+$/;
			if(!req.test(rootNamespace)){
				res.json([]);
				return;
			}
			dbUtil.subNamespaceList(rootNamespace, docs => {
				let r_namespaceList = [];
				let r_namespace = null;
				let preCount = 0;
				let executedCount = 0;
				doc.forEach((namespace, namespaceIndex) => {
					r_namespace = {};
					r_namespace.namespace = namespace.namespace;
					r_namespace.height = namespace.height;
					r_namespace.mosaics = namespace.mosaics;
					r_namespace.creator = namespace.creator;
					r_namespace.timeStamp = namespace.timeStamp;
					r_namespace.expiredTime = namespace.expiredTime;
					r_namespaceList.push(r_namespace);
				});
				res.json(r_namespaceList);
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
					r_mosaic.mosaic = data_mosaic.data[i].mosaicId.namespaceId + ":" + data_mosaic.data[i].mosaicId.name;
					r_mosaic.quantity = data_mosaic.data[i].quantity;
					r_mosaic.namespace = data_mosaic.data[i].mosaicId.namespaceId;
					r_mosaic.id = data_mosaic.data[i].mosaicId.name;
					r_mosaicList.push(r_mosaic);
				}
				let quantityFixCount = 0;
				for(let i in r_mosaicList){
					nis.allMosaicDefinitionListByNamespace(r_mosaicList[i].namespace, null, [], data_definition => {
						for(let j in data_definition){
							if(data_definition[j].mosaic.id.name==r_mosaicList[i].id){
								let divisibility = 0;
								for(let k in data_definition[j].mosaic.properties){
									if(data_definition[j].mosaic.properties[k].name=="divisibility"){
										divisibility = data_definition[j].mosaic.properties[k].value;
										break;
									}
								}
								if(r_mosaicList[i].quantity!=0)
									r_mosaicList[i].quantity = r_mosaicList[i].quantity/Math.pow(10, parseInt(divisibility));
							}
						}
						quantityFixCount++;
						if(quantityFixCount==r_mosaicList.length)
							res.json(r_mosaicList);
					});
				}
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