import nis from '../utils/nisRequest';
import schedule from 'node-schedule';
import mongoose from 'mongoose';

let scheduleCheckMosaic = () => {
	checkMosaic();
	let rule = new schedule.RecurrenceRule();
	rule.minute = [1, 16, 31, 46];
	schedule.scheduleJob(rule, () => {
		checkMosaic();
	});
}

/**
 * check mosaic from namespace
 */
let checkMosaic = () => {
	let Namespace = mongoose.model("Namespace");
	Namespace.find().exec((err, doc) => {
		if(err)
			return;
		doc.forEach(item => {
			if(!item || !item.name)
				return;
			nis.mosaicDefinitionListByNamespace(item.name, data => {
				if(!data || !data.data || data.data.length==0)
					return;
				let mosaicNames = "";
				for(let i in data.data) {
					mosaicNames += data.data[i].mosaic.id.name + " ";
				}
				Namespace.update({name: item.name}, {mosaics: data.data.length, mosaicNames: mosaicNames}, (err, doc) => {});
			});
		});
	});
}

module.exports = {
	scheduleCheckMosaic
}
