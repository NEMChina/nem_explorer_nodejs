import NodeCache from 'node-cache';

const appCache = new NodeCache({stdTTL:0, checkperiod:0});
const saveBlockPrefix = "saveBlock_";
const saveTransactionPrefix = "saveTransaction_";
const marketPrefix = "market";
const nodeCachePrefix = "node_";
const accountCachePrefix = "account_";
const accountLastReloadTime = "accountLastReloadTime";

module.exports = {
	appCache,
	marketPrefix,
	saveBlockPrefix,
	nodeCachePrefix,
	accountCachePrefix,
	saveTransactionPrefix,
	accountLastReloadTime,
}