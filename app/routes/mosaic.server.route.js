import MosaicController from '../controllers/mosaic.server.controller';

module.exports = function(app){
	app.route('/mosaic/mosaicListByNamespace').post(MosaicController.mosaicListByNamespace);
	app.route('/mosaic/mosaicList').post(MosaicController.mosaicList);
	app.route('/mosaic/mosaic').post(MosaicController.mosaic);
	app.route('/mosaic/mosaicTransferRecord').post(MosaicController.mosaicTransferRecord);
	app.route('/mosaic/mosaicTransferList').post(MosaicController.mosaicTransferList);
};