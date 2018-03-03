angular.module("webapp").controller("MosaicListController", ["$scope", "MosaicService", MosaicListController]);
angular.module("webapp").controller("MosaicController", ["$scope", "$timeout", "$location", "MosaicService", MosaicController]);
angular.module("webapp").controller("MosaicTransferController", ["$scope", "$interval", "MosaicService", MosaicTransferController]);

function MosaicListController($scope, MosaicService){
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

function MosaicTransferController($scope, $interval, MosaicService){
	MosaicService.mosaicTransferList({}, function(r_list){
		r_list.forEach((r, index) => {
			r.time = r.timeStamp;
			r.timeStamp = fmtDate(r.timeStamp);
		});
		$scope.mosaicTransferList = r_list;
		$scope.updateAge();
	});
	// websocket - new mosaic
	let sock = new SockJS('/ws/mosaic');
	sock.onmessage = function(e) {
		console.info(1111);
		if(!e || !e.data)
			return;
		let mosaics = JSON.parse(e.data);
		if(!mosaics)
			return;
		mosaics.forEach(item => {
			let m = {};
			m.time = item.timeStamp;
			m.mosaic = item.mosaicName;
			m.namespace = item.namespace;
			m.sender = item.sender;
			m.recipient = item.recipient;
			m.quantity = item.quantity;
			m.timeStamp = fmtDate(item.timeStamp);
			console.info(m);
			$scope.mosaicTransferList.unshift(m);
		});
    };
    // block age
	$interval(function() {
		$scope.updateAge();
	}, 1000);
	$scope.updateAge = function(){
		let nowTime = new Date().getTime();
		$scope.mosaicTransferList.forEach(m => {
			m.age = compareTime(nowTime, m.time);
		});
	};
}