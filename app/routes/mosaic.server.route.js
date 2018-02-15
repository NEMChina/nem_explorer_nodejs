import MosaicController from '../controllers/mosaic.server.controller';

module.exports = function(app){
	app.route('/mosaic/mosaicListByNamespace').post(MosaicController.mosaicListByNamespace);
};