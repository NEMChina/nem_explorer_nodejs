angular.module("webapp").controller("MosaicListController", ["$scope", "MosaicService", MosaicListController]);
angular.module("webapp").controller("MosaicController", ["$scope", "$timeout", "$location", "MosaicService", MosaicController]);
angular.module("webapp").controller("MosaicTransferController", ["$scope", "$timeout", "$interval", "MosaicService", MosaicTransferController]);

const mosaicListLimit = 50;
const mosaicTransferListLimit = 50;
const mosaicDetailMosaicTransferListLimit = 50;

function MosaicListController($scope, MosaicService){
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	MosaicService.mosaicList({}, function(r_list){
		r_list.forEach(r => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.initialSupply = fmtMosaic(r.initialSupply, r.divisibility);
		});
		$scope.mosaicList = r_list;
	});
	$scope.loadMore = () => {
		if($scope.endFlag)
			return;
		if($scope.loadingFlag)
			return;
		if(!$scope.mosaicList || $scope.mosaicList.length==0)
			return;
		let length = $scope.mosaicList.length;
		let lastNo = $scope.mosaicList[length-1].no;
		if(!lastNo)
			return;
		$scope.loadingFlag = true;
		// attach the search conditions
		let params = {no: lastNo};
		MosaicService.mosaicList(params, function(r_list){
			if(r_list.length==0){
				$scope.endFlag = true;
				return;
			}
			r_list.forEach(r => {
				r.timeStamp = fmtDate(r.timeStamp);
				r.initialSupply = fmtMosaic(r.initialSupply, r.divisibility);
			});
			$scope.mosaicList = $scope.mosaicList.concat(r_list);
			$scope.loadingFlag = false;
			if(r_list.length<mosaicListLimit)
				$scope.endFlag = true;
		});
	};
}

function MosaicController($scope, $timeout, $location, MosaicService){
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	let ns = $location.search().ns;
	let m = $location.search().m;
	if(!ns){
		$scope.message = "Search condition [ns] is needed";
		return;
	}
	if(!m){
		$scope.message = "Search condition [m] is needed";
		return;
	}
	$scope.currentNamespace = ns;
	$scope.currentMosaic = m;
	let params = {ns: ns, m: m};
	let mosaicID = ns + ":" + m;
	MosaicService.mosaic(params, function(r){
		if(!r || !r.mosaicName){
			$scope.message = "MosaicID \"" + mosaicID + "\" do not exist";
			return;
		}
		r.timeStamp = fmtDate(r.timeStamp);
		r.initialSupply = fmtSplit(r.initialSupply.toFixed(r.divisibility));
		$scope.mosaic = r;
		MosaicService.mosaicTransferList(params, function(r_list){
			r_list.forEach(item => {
				item.timeStamp = fmtDate(item.timeStamp);
				item.quantity = fmtMosaic(item.quantity, item.div);
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
	// load more
	$scope.loadMore = () => {
		if($scope.endFlag)
			return;
		if($scope.loadingFlag)
			return;
		if(!$scope.mosaicTransferList || $scope.mosaicTransferList.length==0)
			return;
		let length = $scope.mosaicTransferList.length;
		let lastNo = $scope.mosaicTransferList[length-1].no;
		if(!lastNo)
			return;
		$scope.loadingFlag = true;
		// attach the search conditions
		let params = {ns: $scope.currentNamespace, m: $scope.currentMosaic};
		params.no = lastNo;
		MosaicService.mosaicTransferList(params, function(r_list){
			if(r_list.length==0){
				$scope.endFlag = true;
				return;
			}
			r_list.forEach(item => {
				item.timeStamp = fmtDate(item.timeStamp);
				item.quantity = fmtMosaic(item.quantity, item.div);
			});
			$scope.mosaicTransferList = $scope.mosaicTransferList.concat(r_list);
			$scope.loadingFlag = false;
			if(r_list.length<mosaicDetailMosaicTransferListLimit)
				$scope.endFlag = true;
		});
	};
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

function MosaicTransferController($scope, $timeout, $interval, MosaicService){
	$scope.currentNamespace = "";
	$scope.currentMosaic = "";
	$scope.searchingFlag = false;
	$scope.warningFlag = false;
	$scope.nothingToShowFlag = false;
	$scope.fadeFlag = false;
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	MosaicService.mosaicTransferList({}, function(r_list){
		if(r_list.length==0){
			nothingToShowFlag = true;
			return;
		}
		r_list.forEach((r, index) => {
			r.time = r.timeStamp;
			r.timeStamp = fmtDate(r.timeStamp);
			r.quantity = fmtMosaic(r.quantity, r.div);
		});
		$scope.mosaicTransferList = r_list;
		$scope.updateAge();
		$timeout(function(){
			$scope.fadeFlag = true;
		});	
	});
	// websocket - new mosaic
	let sock = new SockJS('/ws/mosaic');
	sock.onmessage = function(e) {
		if(!e || !e.data)
			return;
		let mosaics = JSON.parse(e.data);
		if(!mosaics)
			return;
		$scope.nothingToShowFlag = false;
		mosaics.forEach(item => {
			let m = {};
			m.no = item.no;
			m.hash = item.hash;
			m.time = item.timeStamp;
			m.mosaic = item.mosaicName;
			m.namespace = item.namespace;
			m.sender = item.sender;
			m.recipient = item.recipient;
			console.info(item);
			m.quantity = fmtMosaic(item.quantity, item.div);
			m.timeStamp = fmtDate(item.timeStamp);
			if($scope.currentNamespace!="" && $scope.currentMosaic!=""){
				if($scope.currentNamespace==m.namespace && $scope.currentMosaic==m.mosaic)
					$scope.mosaicTransferList.unshift(m);
			} else {
				$scope.mosaicTransferList.unshift(m);
			}
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
	$scope.loadMore = () => {
		if($scope.endFlag)
			return;
		if($scope.loadingFlag)
			return;
		if(!$scope.mosaicTransferList || $scope.mosaicTransferList.length==0)
			return;
		let length = $scope.mosaicTransferList.length;
		let lastNo = $scope.mosaicTransferList[length-1].no;
		if(!lastNo)
			return;
		$scope.loadingFlag = true;
		// attach the search conditions
		let params = {};
		if($scope.currentNamespace!="" && $scope.currentMosaic!="")
			params = {ns: $scope.currentNamespace, m:$scope.currentMosaic};
		params.no = lastNo;
		MosaicService.mosaicTransferList(params, function(r_list){
			if(r_list.length==0){
				$scope.endFlag = true;
				return;
			}
			r_list.forEach((r, index) => {
				r.time = r.timeStamp;
				r.timeStamp = fmtDate(r.timeStamp);
				r.quantity = fmtMosaic(r.quantity, r.div);
			});
			$scope.fadeFlag = false;
			$scope.mosaicTransferList = $scope.mosaicTransferList.concat(r_list);
			$scope.loadingFlag = false;
			if(r_list.length<mosaicTransferListLimit)
				$scope.endFlag = true;
			$scope.updateAge();
			$timeout(function(){
				$scope.fadeFlag = true;
			});	
		});
	};
	$scope.searchMosaic = () => {
		$scope.warningFlag = false;
		let inputMosaic = $scope.searchInput;
		if(!inputMosaic){ // blank search conditions
			if($scope.currentNamespace=="" && $scope.currentMosaic=="")
				return;
			// reset the list
			$scope.searchingFlag = true;
			MosaicService.mosaicTransferList({}, function(r_list){
				r_list.forEach((r, index) => {
					r.time = r.timeStamp;
					r.timeStamp = fmtDate(r.timeStamp);
				});
				$scope.currentNamespace = "";
				$scope.currentMosaic = "";
				$scope.fadeFlag = false;
				$scope.searchingFlag = false;
				$scope.mosaicTransferList = r_list;
				$scope.updateAge();
				$timeout(function(){
					$scope.fadeFlag = true;
				});	
			});
		} else { // non blank search conditions
			// check mosaic ID format
			let reg = /^([a-zA-Z0-9_-]+(.[a-zA-Z0-9'_-])*):([a-zA-Z0-9'_-]+)$/;
			if(!reg.test(inputMosaic)){
				$scope.warningContent = "Invalid mosaic ID";
				$scope.warningFlag = true;
				return;
			}
			// get namespace and mosaic form mosaic ID
			let match = inputMosaic.match(reg);
			let ns = null;
			let m = null;
			if(match && match.length>0){
				ns = match[1];
				m = match[3];
			}
			if(!ns || !m){
				$scope.warningContent = "Invalid mosaic ID";
				$scope.warningFlag = true;
				return;
			}
			$scope.searchingFlag = true;
			MosaicService.mosaic({ns: ns, m: m}, function(r_mosaic){
				if(!r_mosaic || !r_mosaic.mosaicName){
					$scope.warningContent = "Mosaic ID do not exist";
					$scope.searchingFlag = false;
					$scope.warningFlag = true;
					return;
				}
				$scope.currentNamespace = ns;
				$scope.currentMosaic = m;
				MosaicService.mosaicTransferList({ns: ns, m: m}, function(r_list){
					r_list.forEach((r, index) => {
						r.time = r.timeStamp;
						r.timeStamp = fmtDate(r.timeStamp);
					});
					$scope.fadeFlag = false;
					$scope.searchingFlag = false;
					$scope.mosaicTransferList = r_list;
					$scope.loadingFlag = false;
					$scope.updateAge();
					$timeout(function(){
						$scope.fadeFlag = true;
					});	
				});
			});
		}
	};
	$scope.closeWarning = () => {
		$scope.warningFlag = false;
	};
	$scope.showMT = (index, $event) => {
		$scope.selectedNO = $scope.mosaicTransferList[index].no;
		$scope.selectedItem = $scope.mosaicTransferList[index];
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$("#mtDetail").modal("show");
	};
	
}