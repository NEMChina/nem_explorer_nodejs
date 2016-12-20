angular.module('webapp').service('NamespaceService', ["$http", NamespaceService]);

function NamespaceService($http){
	return {
		namespaceList: function(params, callback) {
			$http.post("/namespace/list", params).success(function(data){
				callback(data);
			});
		}
	}
}