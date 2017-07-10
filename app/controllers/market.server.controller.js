import cache from '../cache/appCache';

module.exports = {

	/**
     * get market info
     */
	market: (req, res, next) => {
		try {
			let market = cache.appCache.get(cache.marketPrefix);
			if(!market)
				res.json({});
			else
				res.json(market);
		} catch (e) {
			console.error(e);
		}
	}
}