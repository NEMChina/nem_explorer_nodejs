import NamespaceController from '../controllers/namespace.server.controller';

module.exports = function(app){
	app.route('/namespace/list').post(NamespaceController.namespaceList);
};