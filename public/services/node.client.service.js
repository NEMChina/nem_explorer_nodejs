angular.module('webapp').service('NodeService', ["$http", NodeService]);

function NodeService($http){
	return {
		nodeList: function(callback) {
			$http.post("/node/list").success(function(data){
				callback(data);
			});
		}
	}
}