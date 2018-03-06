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
				module.exports.fixMosaicTXQuantity(docs, mosaicTXs => {
					res.json(mosaicTXs);
				});
			});
		} catch (e) {
			console.error(e);
		}
	},

	/**
     * fix mosaic transactions quantity (divisibility)
     */
	fixMosaicTXQuantity: (mosaicTXs, callback) => {
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
				mosaicTXs.forEach(r => {
					let id = r.namespace+":"+r.mosaic;
					if(!divMap.has(id))
						return;
					let div = 1;
					if(divMap.get(id) && divMap.get(id)!=0)
						div = Math.pow(10, divMap.get(id));
					r.quantity = r.quantity / div;
				});
				callback(mosaicTXs);
			});
		} catch (e) {
			console.error(e);
		}
	}
}