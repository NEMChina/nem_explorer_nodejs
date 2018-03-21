angular.module("webapp").controller("NamespaceListController", ["$scope", "$timeout", "NamespaceService", NamespaceListController]);
angular.module("webapp").controller("NamespaceController", ["$scope", "$timeout", "$location", "NamespaceService", "MosaicService", NamespaceController]);

const namespaceListLimit = 50;

function NamespaceListController($scope, $timeout, NamespaceService){
	$scope.currentNamespace = "";
	$scope.searchingFlag = false;
	$scope.warningFlag = false;
	$scope.loadingFlag = false;
	$scope.endFlag = false;
	NamespaceService.rootNamespaceList({}, function(r_namespaceList){
		r_namespaceList.forEach((r, index) => {
			r_namespaceList = setSubsCount(r_namespaceList);
			r.expired = false;
			r.originalExpiredTime = r.expiredTime;
			r.timeStamp = fmtDate(r.timeStamp);
			r.expiredTime = fmtDate(r.expiredTime);
		});
		$scope.namespaceList = r_namespaceList;
		$scope.resetExpired();
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
			r_list = setSubsCount(r_list);
			r_list.forEach(r => {
				r.expired = false;
				r.originalExpiredTime = r.expiredTime;
				r.timeStamp = fmtDate(r.timeStamp);
				r.expiredTime = fmtDate(r.expiredTime);
			});
			$scope.namespaceList = $scope.namespaceList.concat(r_list);
			$scope.loadingFlag = false;
			if(r_list.length<namespaceListLimit)
				$scope.endFlag = true;
			$scope.resetExpired();
		});
	};
	$scope.resetExpired = () => {
		let nowTime = new Date().getTime();
		$scope.namespaceList.forEach((ns, i) => {
			let expiredTime = getDateFromNemTime(ns.originalExpiredTime);
			if(nowTime>expiredTime.getTime())
				$scope.namespaceList[i].expired = true;
		});
	};
	$scope.showSubs = (index, $event) => {
		if(!$scope.namespaceList[index].subsCount)
			return;
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1)
			return;
		$scope.selectedNamespace = $scope.namespaceList[index].namespace;
		let subNamespaces = $scope.namespaceList[index].subNamespaces;
		if(!subNamespaces)
			return;
		subNamespaces = subNamespaces.split(" ").filter(item => {
			return item!="";
		});
		$scope.subs = subNamespaces;
		$("#namespaceDetail").modal("show");
	};
	$scope.closeWarning = () => {
		$scope.warningFlag = false;
	};
	$scope.searchNamespace = () => {
		$scope.warningFlag = false;
		let inputNamespace = $scope.searchInput;
		$scope.selectedNamespace = "";
		if(!inputNamespace){ // blank search conditions
			if($scope.currentNamespace=="")
				return;
			// reset the list
			$scope.searchingFlag = true;
			NamespaceService.rootNamespaceList({}, function(r_namespaceList){
				r_namespaceList = setSubsCount(r_namespaceList);
				r_namespaceList.forEach((r, index) => {
					r.expired = false;
					r.originalExpiredTime = r.expiredTime;
					r.timeStamp = fmtDate(r.timeStamp);
					r.expiredTime = fmtDate(r.expiredTime);
				});
				$scope.currentNamespace = "";
				$scope.searchingFlag = false;
				$scope.namespaceList = r_namespaceList;
				$scope.resetExpired();
			});
		} else { // non blank search conditions
			// check namespace format
			let reg = /^[a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*$/;
			if(!reg.test(inputNamespace)){
				$scope.warningContent = "Invalid namespace";
				$scope.warningFlag = true;
				return;
			}
			$scope.searchingFlag = true;
			// attach the search conditions
			let params = {ns: inputNamespace};
			NamespaceService.rootNamespaceByNamespace(params, function(r_namespaceList){
				if(!r_namespaceList || r_namespaceList.length==0){
					$scope.warningContent = "Namespace do not exist";
					$scope.searchingFlag = false;
					$scope.warningFlag = true;
					return;
				}
				r_namespaceList = setSubsCount(r_namespaceList);
				r_namespaceList.forEach((r, index) => {
					r.expired = false;
					r.originalExpiredTime = r.expiredTime;
					r.timeStamp = fmtDate(r.timeStamp);
					r.expiredTime = fmtDate(r.expiredTime);
				});
				$scope.currentNamespace = inputNamespace;
				$scope.namespaceList = r_namespaceList;
				$scope.searchingFlag = false;
			});
		}
	};
	let setSubsCount = (r_namespaceList) => {
		r_namespaceList.forEach(r => {
			if(r.subNamespaces){
				let subs = r.subNamespaces.split(" ");
				let subsCount = 0;
				subs.forEach(s => {
					if(s!="")
						subsCount++;
				});
				r.subsCount = subsCount;
			}
		});
		return r_namespaceList;
	};
}

function NamespaceController($scope, $timeout, $location, NamespaceService, MosaicService){
	let ns = $location.search().ns;
	if(!ns){
		$scope.message = "Search condition [ns] is needed";
		return;
	}
	$scope.searchNamespace = ns;
	$scope.searchSub = "";
	if(ns.indexOf(".")!=-1){
		$scope.searchNamespace = ns.substring(0, ns.indexOf("."));
		$scope.searchSub = ns;
	}
	let params = {ns: $scope.searchNamespace};
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
		let initIndex = 0;
		if($scope.searchSub!=""){
			$scope.namespaceList.forEach((r, index) => {
				if($scope.searchSub==$scope.namespaceList[index].namespace)
					initIndex = index;
			});
		}
		$scope.select = $scope.namespaceList[initIndex];
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
				m.initialSupply = fmtMosaic(m.initialSupply, m.divisibility);
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


