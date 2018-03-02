import NodeCache from 'node-cache';

const appCache = new NodeCache({stdTTL:0, checkperiod:0});
const marketPrefix = "market";
const nodeCachePrefix = "node_";
const accountCachePrefix = "account_";
const accountLastReloadTime = "accountLastReloadTime";

module.exports = {
	appCache,
	marketPrefix,
	nodeCachePrefix,
	accountCachePrefix,
	accountLastReloadTime,
}