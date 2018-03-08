import mongoose from 'mongoose';
import dbUtil from '../utils/dbUtil';
import nis from '../utils/nisRequest';

const mosaicListLimit = 50;
const mosaicTransferListLimit = 50;

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
			dbUtil.mosaicListByNamespace(ns, docs => {
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
			dbUtil.mosaicList(no, mosaicListLimit, docs => {
				res.json(docs);
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
			dbUtil.findOneMosaic(m, ns, doc => {
				if(!doc){
					res.json({});
					return;
				}
				res.json(doc);
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
			dbUtil.mosaicTransferList(m, ns, page, mosaicTransferListLimit, docs => {
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
			dbUtil.mosaicTransferList(m, ns, no, mosaicTransferListLimit, docs => {
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
			dbUtil.findMosaics(findMosaicParams, mosaics => {
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
	}
};

