import BlockController from '../controllers/block.server.controller';

module.exports = function(app){
	app.route('/block/height').get(BlockController.blockHeight);
	app.route('/block/list').post(BlockController.blockList);
	app.route('/block/at').post(BlockController.blockAt);
	app.route('/block/blockAtBySearch').post(BlockController.blockAtBySearch);
};