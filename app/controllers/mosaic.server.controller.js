import mongoose from 'mongoose';
import dbUtil from '../utils/dbUtil';
import nis from '../utils/nisRequest';

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
				// docs.forEach((item, index) => {
				// 	item.subNamespaces = item.subNamespaces?item.subNamespaces:"";
				// });
				res.json(docs);
			});
		} catch (e) {
			console.error(e);
		}
	}
}