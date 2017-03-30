import https from 'https';
import nis from './nisRequest';
import schedule from 'node-schedule';
import cache from '../cache/nodeCache';
import mongoose from 'mongoose';

let scheduleFetchNode = () => {
	fetchNode();
	let rule = new schedule.RecurrenceRule();
	rule.second = [1]; //fetch node height every minute
	schedule.scheduleJob(rule, () => {
		fetchNode();
	});
}

/**
 * fetch block height from every node
 */
let fetchNode = () => {
	try {
		nis.nodePeerListReachable(data => {
			if(!data || !data.data){
				res.json([]);
				return;
			}
			//collect all the supernodes
			let hostMap = new Map();
			let nameMap = new Map();
			let Supernode = mongoose.model('Supernode');
			Supernode.find().exec((err, doc) => {
				if(err){
					console.error(err);
					res.json(r_nodeArray);
					return;
				}
				doc.forEach(item => {
					hostMap.set(item.host, item.id);
					nameMap.set(item.name, item.id);
				});
				//collect all the nodes
				let r_nodeArray = [];
				data.data.forEach(node => {
					if(node && node.metaData && node.endpoint && node.identity){
						let r_node = {};
						r_node.host = node.endpoint.host;
						r_node.port = node.endpoint.port;
						r_node.name = node.identity.name;
						r_node.version = node.metaData.version;
						//discover the supernodes from all the nodes
						if(hostMap.get(r_node.host))
							r_node.superNodeID = hostMap.get(r_node.host);
						else if(nameMap.get(r_node.name))
							r_node.superNodeID = nameMap.get(r_node.name);
						nis.blockHeightByHostAndPort(node.endpoint.host, node.endpoint.port, data => {
							if(data && data.height){
								r_node.height = data.height;
							}
							cache.cache.set(cache.cachePrefix + node.endpoint.host, r_node);
						});
					}
				});
			});
		});
	} catch (e) {
		console.error(e);
	}
}

module.exports = {
	scheduleFetchNode
}
