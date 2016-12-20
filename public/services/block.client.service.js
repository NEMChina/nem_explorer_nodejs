angular.module('webapp').service('BlockService', ["$http", BlockService]);

function BlockService($http){
	return {
		blockHeight: function(callback) {
			$http.get("/block/height").success(function(data){
				callback(data);
			});
		},
		blockList: function(params, callback) {
			$http.post("/block/list", params).success(function(data){
				callback(data);
			});
		},
		blockAt: function(params, callback) {
			$http.post("/block/at", params).success(function(data){
				callback(data);
			});
		},
		blockAtBySearch: function(params, callback) {
			$http.post("/block/blockAtBySearch", params).success(function(data){
				callback(data);
			});
		}
	}
}