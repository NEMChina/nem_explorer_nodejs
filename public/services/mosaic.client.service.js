angular.module('webapp').service('MosaicService', ["$http", MosaicService]);

function MosaicService($http){
	return {
		mosaicListByNamespace: function(params, callback) {
			$http.post("/mosaic/mosaicListByNamespace", params).success(function(data){
				callback(data);
			});
		}
	}
}