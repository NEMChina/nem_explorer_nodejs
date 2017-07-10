import NamespaceController from '../controllers/namespace.server.controller';

module.exports = function(app){
	app.route('/namespace/list').post(NamespaceController.namespaceList);
	app.route('/namespace/namespaceListByAddress').post(NamespaceController.namespaceListByAddress);
	app.route('/namespace/mosaicListByAddress').post(NamespaceController.mosaicListByAddress);
	app.route('/namespace/mosaicListByNamespace').post(NamespaceController.mosaicListByNamespace);
};