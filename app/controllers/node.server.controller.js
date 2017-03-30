import cache from '../cache/nodeCache';

module.exports = {

	/**
     * get node list (including supernodes)
     */
	nodeList: (req, res, next) => {
		try {
			let r_nodeArray = [];
			cache.cache.keys((err, keys) => {
				if(err){
					console.err(err);
					res.json(r_nodeArray);
					return;
				}
				cache.cache.mget(keys, (err, value) => {
					if(err){
						console.err(err);
						res.json(r_nodeArray);
						return;
					}
					for(let i=0;i<keys.length;i++){
						r_nodeArray.push(value[keys[i]]);
					}
					res.json(r_nodeArray);
				});
			});
		} catch (e) {
			console.error(e);
		}
	}
}