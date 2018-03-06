angular.module("webapp").controller("NamespaceListController", ["$scope", "$timeout", "NamespaceService", NamespaceListController]);
angular.module("webapp").controller("NamespaceController", ["$scope", "$timeout", "$location", "NamespaceService", "MosaicService", NamespaceController]);

const namespaceListLimit = 50;

function NamespaceListController($scope, $timeout, NamespaceService){
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	NamespaceService.rootNamespaceList({}, function(r_namespaceList){
		r_namespaceList.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.expiredTime = fmtDate(r.expiredTime);
		});
		$scope.namespaceList = r_namespaceList;
	});
	$scope.loadMore = () => {
		if($scope.endFlag)
			return;
		if($scope.loadingFlag)
			return;
		if(!$scope.namespaceList || $scope.namespaceList.length==0)
			return;
		let length = $scope.namespaceList.length;
		let lastNo = $scope.namespaceList[length-1].no;
		if(!lastNo)
			return;
		$scope.loadingFlag = true;
		// attach the search conditions
		let params = {no: lastNo};
		NamespaceService.rootNamespaceList(params, function(r_list){
			if(r_list.length==0){
				$scope.endFlag = true;
				return;
			}
			r_list.forEach(r => {
				r.timeStamp = fmtDate(r.timeStamp);
				r.expiredTime = fmtDate(r.expiredTime);
			});
			$scope.namespaceList = $scope.namespaceList.concat(r_list);
			$scope.loadingFlag = false;
			if(r_list.length<namespaceListLimit)
				$scope.endFlag = true;
		});
	};
}

function NamespaceController($scope, $timeout, $location, NamespaceService, MosaicService){
	let ns = $location.search().ns;
	if(!ns){
		$scope.message = "Search condition [ns] is needed";
		return;
	}
	let params = {ns: ns};
	$scope.searchNamespace = ns;
	NamespaceService.namespaceListbyNamespace(params, function(r_namespaceList){
		if(r_namespaceList.length==0){
			$scope.message = "Namespace \"" + ns + "\" do not exist";
			return;
		}
		r_namespaceList.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.expiredTime = fmtDate(r.expiredTime);
		});
		$scope.namespaceList = r_namespaceList;
		$scope.select = $scope.namespaceList[0];
		$scope.changeSelectOption($scope.select);
	});
	// change the option
	$scope.changeSelectOption = function(select){
		if(!select || !select.namespace)
			return;
		MosaicService.mosaicListByNamespace({"ns": select.namespace}, function(r_mosaicList) {
			if(!r_mosaicList){
				$scope.mosaicList = [];
				return;
			}
			r_mosaicList.forEach((m, index) => {
				m.timeStamp = fmtDate(m.timeStamp);
				m.initialSupply = fmtXEM(m.initialSupply);
				if(m.updateTimeStamp)
					m.updateTimeStamp = fmtDate(m.updateTimeStamp);
				m.mosaic = m.namespace + ":" + m.mosaicName;
			});
			$scope.mosaicList = r_mosaicList;
		});
	};
	//show mosaic (popup)
	$scope.showMosaic = function(index, $event){
		$scope.selectedMosaicIndex = index;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		$scope.selectedMosaic = $scope.mosaicList[index];
		$("#mosaicDetail").modal("show");
	};
}


