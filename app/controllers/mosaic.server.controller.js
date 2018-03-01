import mongoose from 'mongoose';
import dbUtil from '../utils/dbUtil';
import nis from '../utils/nisRequest';

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
			dbUtil.mosaicList(docs => {
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
				res.json([]);
				return;
			}
			// validate mosaic
			let reg_m = /^[a-zA-Z0-9'_-]+$/;
			if(!m || !reg_m.test(m)){
				res.json([]);
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
     * get mosaic transfer list
     */
	mosaicTransferList: (req, res, next) => {
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
	}
}