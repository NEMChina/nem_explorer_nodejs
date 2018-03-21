import NamespaceController from '../controllers/namespace.server.controller';

module.exports = function(app){
	app.route('/namespace/rootNamespaceList').post(NamespaceController.rootNamespaceList);
	app.route('/namespace/subNamespaceList').post(NamespaceController.subNamespaceList);
	app.route('/namespace/namespaceListbyNamespace').post(NamespaceController.namespaceListbyNamespace);
	app.route('/namespace/namespaceListByAddress').post(NamespaceController.namespaceListByAddress);
	app.route('/namespace/mosaicListByAddress').post(NamespaceController.mosaicListByAddress);
	app.route('/namespace/mosaicListByNamespace').post(NamespaceController.mosaicListByNamespace);
	app.route('/namespace/rootNamespaceByNamespace').post(NamespaceController.rootNamespaceByNamespace);
};