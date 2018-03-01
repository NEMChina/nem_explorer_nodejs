angular.module("webapp").controller("MosaicListController", ["$scope", "$timeout", "MosaicService", MosaicListController]);
angular.module("webapp").controller("MosaicController", ["$scope", "$timeout", "$location", "MosaicService", MosaicController]);

function MosaicListController($scope, $timeout, MosaicService){
	MosaicService.mosaicList(function(r_list){
		r_list.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			if(r.updateTimeStamp)
				r.updateTimeStamp = fmtDate(r.updateTimeStamp);
		});
		$scope.mosaicList = r_list;
	});
}

function MosaicController($scope, $timeout, $location, MosaicService){
	$scope.notFound = false;
	let ns = $location.search().ns;
	let m = $location.search().m;
	if(!ns || !m)
		$scope.notFound = true;
	let params = {ns: ns, m: m};
	MosaicService.mosaic(params, function(r){
		r.timeStamp = fmtDate(r.timeStamp);
		if(r.updateTimeStamp)
			r.updateTimeStamp = fmtDate(r.updateTimeStamp);
		$scope.mosaic = r;
		MosaicService.mosaicTransferList(params, function(r_list){
			let divisibility = 1;
			if(r.divisibility && r.divisibility!=0)
				divisibility = Math.pow(10, r.divisibility);
			r_list.forEach(item => {
				item.timeStamp = fmtDate(item.timeStamp);
				item.quantity = item.quantity / divisibility;
			});
			$scope.mosaicTransferList = r_list;
		});
	});
	// init tabs
	$timeout(function() {
		$('#tab a').click(function (e) {
	    	e.preventDefault();
	    	$(this).tab('show');
	  	});
	}, 100);
	// show mosaic transfer detail
	$scope.showMosaicTransferDetail = function(index, $event){
		$scope.selectedIndex = index;
		$scope.selectedMosaicTransfer = $scope.mosaicTransferList[index];
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#mosaicTransferDetail").modal("show");
	};
}