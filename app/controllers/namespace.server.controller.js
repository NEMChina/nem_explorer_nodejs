import mongoose from 'mongoose';
import nis from '../utils/nisRequest';

const LISTSIZE = 100;

module.exports = {

	/**
     * get namespace list (including the amount of the mosaic)
     */
	namespaceList: (req, res, next) => {
		try {
			let Namespace = mongoose.model('Namespace');
			let skip = (req.body.page-1)*LISTSIZE;
			Namespace.find().sort({timeStamp: -1}).skip(skip).limit(LISTSIZE).exec((err, doc) => {
				if(err){
					console.info(err);
					req.json([]);
					return;
				}
				let r_namespaceList = [];
				let r_namespace = null;
				let preCount = 0;
				let executedCount = 0;
				doc.forEach((namespace, namespaceIndex) => {
					r_namespace = {};
					r_namespace.name = namespace.name;
					r_namespace.creator = namespace.creator;
					r_namespace.timeStamp = namespace.timeStamp;
					r_namespace.mosaicAmount = namespace.mosaics;
					r_namespace.mosaicList = [];
					r_namespaceList.push(r_namespace);
					if(namespace.mosaics>0){
						preCount++;
						nis.mosaicListByNamespace(namespace.name, data => {
							executedCount++;
							if(!data || !data.data)
								return;
							let r_mosaicList = [];
							let r_mosaic = null;
							data.data.forEach((mosaic, index) => {
								r_mosaic = {};
								r_mosaic.no = index+1;
								r_mosaic.name = (mosaic.mosaic && mosaic.mosaic.id)?mosaic.mosaic.id.name:'';
								if(mosaic.mosaic && mosaic.mosaic.properties){
									mosaic.mosaic.properties.forEach(property => {
										if(property.name=='initialSupply')
											r_mosaic.initialSupply = property.value;
										if(property.name=='transferable')
											r_mosaic.transferable = property.value;
									});
								}
								r_mosaicList.push(r_mosaic);
							});
							r_namespaceList[namespaceIndex].mosaicList = r_mosaicList;
							if(preCount==executedCount){
								res.json(r_namespaceList);
							}
						});
					}
				});
			});
		} catch (e) {
			console.error(e);
		}
	}
}