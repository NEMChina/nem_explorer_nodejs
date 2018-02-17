angular.module("webapp").controller("MosaicListController", ["$scope", "$timeout", "MosaicService", MosaicListController]);

function MosaicListController($scope, $timeout, MosaicService){
	MosaicService.mosaicList(function(r_list){
		console.info(r_list);
		r_list.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.updateTimeStamp = fmtDate(r.updateTimeStamp);
		});
		$scope.mosaicList = r_list;
	});
}