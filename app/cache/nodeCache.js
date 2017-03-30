import NodeCache from 'node-cache';

const cache = new NodeCache({stdTTL:0, checkperiod:0});
const cachePrefix = "node_";

module.exports = {
	cache,
	cachePrefix
}