angular.module('webapp').service('NamespaceService', ["$http", NamespaceService]);

function NamespaceService($http){
	return {
		namespaceList: function(callback) {
			$http.post("/namespace/list").success(function(data){
				callback(data);
			});
		},
		namespaceListByAddress: function(params, callback) {
			$http.post("/namespace/namespaceListByAddress", params).success(function(data){
				callback(data);
			});
		},
		mosaicListByAddress: function(params, callback) {
			$http.post("/namespace/mosaicListByAddress", params).success(function(data){
				callback(data);
			});
		},
		mosaicListByNamespace: function(params, callback) {
			$http.post("/namespace/mosaicListByNamespace", params).success(function(data){
				callback(data);
			});
		}
	}
}