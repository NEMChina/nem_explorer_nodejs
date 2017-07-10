import MarketController from '../controllers/market.server.controller';

module.exports = function(app){
	app.route('/market/market').post(MarketController.market);
};