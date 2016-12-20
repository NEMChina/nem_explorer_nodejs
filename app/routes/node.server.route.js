import NodeController from '../controllers/node.server.controller';

module.exports = function(app){
	app.route('/node/list').post(NodeController.nodeList);
};