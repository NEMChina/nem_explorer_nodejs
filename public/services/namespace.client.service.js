angular.module('webapp').service('NamespaceService', ["$http", NamespaceService]);

function NamespaceService($http){
	return {
		rootNamespaceList: function(params, callback) {
			$http.post("/namespace/rootNamespaceList", params).success(function(data){
				callback(data);
			});
		},
		subNamespaceList: function(params, callback) {
			$http.post("/namespace/subNamespaceList", params).success(function(data){
				callback(data);
			});
		},
		namespaceListbyNamespace: function(params, callback) {
			$http.post("/namespace/namespaceListbyNamespace", params).success(function(data){
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
		},
		rootNamespaceByNamespace: function(params, callback) {
			$http.post("/namespace/rootNamespaceByNamespace", params).success(function(data){
				callback(data);
			});
		}
	}
}