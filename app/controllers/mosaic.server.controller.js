import mosaicDB from '../db/mosaicDB';
import nis from '../utils/nisRequest';

const mosaicListLimit = 50;
const mosaicTransferListLimit = 50;
const mosaicRichListLimit = 100;

module.exports = {

	/**
     * get mosaic list by namespace
     */
	mosaicListByNamespace: (req, res, next) => {
		try {
			let ns = req.body.ns;
			// validate rootNamespace
			let reg = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!reg.test(ns)){
				res.json([]);
				return;
			}
			mosaicDB.mosaicListByNamespace(ns, docs => {
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic list
     */
	mosaicList: (req, res, next) => {
		try {
			let no = req.body.no;
			// validate no
			let reg_no = /^[0-9]+$/;
			if(!no || !reg_no.test(no))
				no = null;
			mosaicDB.mosaicList(no, mosaicListLimit, docs => {
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic list by mosaic
     */
	mosaicListByMosaic: (req, res, next) => {
		try {
			let ns = req.body.ns;
			let m = req.body.m;
			// validate namespace
			let reg_ns = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!ns || !reg_ns.test(ns)){
				res.json({});
				return;
			}
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m)){
				res.json({});
				return;
			}
			mosaicDB.findOneMosaic(m, ns, doc => {
				if(!doc)
					res.json([]);
				else
					res.json([doc]);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic detail
     */
	mosaic: (req, res, next) => {
		try {
			let ns = req.body.ns;
			let m = req.body.m;
			// validate namespace
			let reg_ns = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!ns || !reg_ns.test(ns)){
				res.json({});
				return;
			}
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m)){
				res.json({});
				return;
			}
			mosaicDB.findOneMosaic(m, ns, doc => {
				if(!doc){
					res.json({});
					return;
				}
				let r_mosaic = {};
				r_mosaic.mosaicName = doc.mosaicName;
				r_mosaic.namespace = doc.namespace;
				r_mosaic.creator = doc.creator;
				r_mosaic.description = doc.description;
				r_mosaic.divisibility = doc.divisibility;
				r_mosaic.height = doc.height;
				r_mosaic.initialSupply = doc.initialSupply;
				r_mosaic.levyFee = doc.levyFee;
				r_mosaic.levyMosaic = doc.levyMosaic;
				r_mosaic.levyNamespace = doc.levyNamespace;
				r_mosaic.levyRecipient = doc.levyRecipient;
				r_mosaic.levyType = doc.levyType;
				r_mosaic.mosaicID = doc.mosaicID;
				r_mosaic.no = doc.no;
				r_mosaic.supplyMutable = doc.supplyMutable;
				r_mosaic.timeStamp = doc.timeStamp;
				r_mosaic.transferable = doc.transferable;
				if(doc.levyMosaic && doc.levyNamespace){ //levy exist
					let m = {};
					m.mosaic = doc.levyMosaic;
					m.namespace = doc.levyNamespace;
					module.exports.queryMosaicTXDivisibility([m], divMap => {
						let id = doc.levyNamespace + ":" + doc.levyMosaic;
						if(divMap && divMap.get(id)){
							r_mosaic.levyDiv = divMap.get(id);
						}
						res.json(r_mosaic);
					});
				} else{ //levy not exist
					res.json(r_mosaic);
				}
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic transfer record
     */
	mosaicTransferRecord: (req, res, next) => {
		try {
			let ns = req.body.ns;
			let m = req.body.m;
			let page = req.body.page;
			// validate namespace
			let reg_ns = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!ns || !reg_ns.test(ns)){
				res.json([]);
				return;
			}
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m)){
				res.json([]);
				return;
			}
			// validate page
			let reg_page = /^[0-9]+$/;
			if(!page || !reg_page.test(page))
				page = 1;
			mosaicDB.mosaicTransferList(m, ns, page, mosaicTransferListLimit, docs => {
				if(!docs){
					res.json([]);
					return;
				}
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic transfer list
     */
	mosaicTransferList: (req, res, next) => {
		try {
			let ns = req.body.ns;
			let m = req.body.m;
			let no = req.body.no;
			// validate namespace
			let reg_ns = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!ns || !reg_ns.test(ns))
				ns = null;
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m))
				m = null;
			// validate no
			let reg_no = /^[0-9]+$/;
			if(!no || !reg_no.test(no))
				no = null;
			mosaicDB.mosaicTransferList(m, ns, no, mosaicTransferListLimit, docs => {
				if(!docs){
					res.json([]);
					return;
				}
				let r_arr = [];
				docs.forEach(doc => {
					let r = {};
					r.no = doc.no;
					r.hash = doc.hash;
					r.sender = doc.sender;
					r.recipient = doc.recipient;
					r.timeStamp = doc.timeStamp;
					r.namespace = doc.namespace;
					r.mosaic = doc.mosaic;
					r.quantity = doc.quantity;
					r.div = 0;
					r_arr.push(r);
				});
				module.exports.setMosaicTXDivisibility(r_arr, mosaicTXs => {
					res.json(mosaicTXs);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * get mosaic right list
     */
	mosaicRichList: (req, res, next) => {
		try {
			let ns = req.body.ns;
			let m = req.body.m;
			let page = req.body.page;
			// validate namespace
			let reg_ns = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!ns || !reg_ns.test(ns))
				ns = null;
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m))
				m = null;
			// validate page
			let reg_page = /^[0-9]+$/;
			if(!page || !reg_page.test(page))
				page = 1;
			if(!ns || !m){
				res.json([]);
				return;
			}
			let mosaicID = ns + ":" + m;
			let skip = mosaicRichListLimit * (page-1);
			mosaicDB.getMosaicRichList(mosaicID, mosaicRichListLimit, skip, docs => {
				if(!docs){
					res.json([]);
					return;
				}
				let r_richList = [];
				docs.forEach(doc => {
					let r = {};
					r._id = doc.id;
					r.address = doc.address;
					r.mosaicID = doc.mosaicID;
					r.quantity = doc.quantity;
					r.namespace = doc.mosaicID.substring(0, doc.mosaicID.indexOf(":"));
					r.mosaic = doc.mosaicID.substring(doc.mosaicID.indexOf(":")+1);
					r_richList.push(r);
				});
				module.exports.setMosaicTXDivisibility(r_richList, richList => {
					res.json(richList);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
	 * set mosaic transactions divisibility
	 */
	setMosaicTXDivisibility: (mosaicTXs, callback) => {
		try {
			let findMosaicSet = new Set();
			let findMosaicParams = [];
			mosaicTXs.forEach(mt => {
				let id = mt.namespace + ":" + mt.mosaic;
				if(!findMosaicSet.has(id)){
					findMosaicSet.add(id);
					findMosaicParams.push({mosaicName: mt.mosaic, namespace: mt.namespace});
				}
			});
			if(findMosaicParams.length==0){
				callback(mosaicTXs);
				return;
			}
			// query mosaic divisibility from DB
			mosaicDB.findMosaics(findMosaicParams, mosaics => {
				let divMap = new Map();
				mosaics.forEach(m => {
					if(m)
						divMap.set(m.namespace+":"+m.mosaicName, m.divisibility);
				});
				mosaicTXs.forEach((r, i) => {
					let id = r.namespace+":"+r.mosaic;
					if(!divMap.has(id))
						return;
					mosaicTXs[i].div = divMap.get(id);
				});
				callback(mosaicTXs);
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
	 * query mosaic transactions divisibility
	 */
	queryMosaicTXDivisibility: (mosaics, callback) => {
		try {
			let divMap = new Map();
			let findMosaicSet = new Set();
			let findMosaicParams = [];
			mosaics.forEach(mt => {
				let id = mt.namespace + ":" + mt.mosaic;
				if(!findMosaicSet.has(id)){
					findMosaicSet.add(id);
					findMosaicParams.push({mosaicName: mt.mosaic, namespace: mt.namespace});
				}
			});
			if(findMosaicParams.length==0){
				callback(divMap);
				return;
			}
			// query mosaic divisibility from DB
			mosaicDB.findMosaics(findMosaicParams, mosaics => {
				mosaics.forEach(m => {
					if(m)
						divMap.set(m.namespace+":"+m.mosaicName, m.divisibility);
				});
				callback(divMap);
			});
		} catch (e) {
			console.error(e);
		}
	}
};

