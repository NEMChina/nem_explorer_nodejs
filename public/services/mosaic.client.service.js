angular.module('webapp').service('MosaicService', ["$http", MosaicService]);

function MosaicService($http){
	return {
		mosaicListByNamespace: function(params, callback) {
			$http.post("/mosaic/mosaicListByNamespace", params).success(function(data){
				callback(data);
			});
		},
		mosaicList: function(params, callback) {
			$http.post("/mosaic/mosaicList", params).success(function(data){
				callback(data);
			});
		},
		mosaic: function(params, callback) {
			$http.post("/mosaic/mosaic", params).success(function(data){
				callback(data);
			});
		},
		mosaicTransferRecord: function(params, callback) {
			$http.post("/mosaic/mosaicTransferRecord", params).success(function(data){
				callback(data);
			});
		},
		mosaicTransferList: function(params, callback) {
			$http.post("/mosaic/mosaicTransferList", params).success(function(data){
				callback(data);
			});
		},
		mosaicListByMosaic: function(params, callback) {
			$http.post("/mosaic/mosaicListByMosaic", params).success(function(data){
				callback(data);
			});
		},
		mosaicRichList: function(params, callback) {
			$http.post("/mosaic/mosaicRichList", params).success(function(data){
				callback(data);
			});
		}
	}
}