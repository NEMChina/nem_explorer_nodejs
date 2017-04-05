angular.module("webapp").controller("NamespaceController", ["$scope", "NamespaceService", NamespaceController]);

function NamespaceController($scope, NamespaceService){
	$scope.page = 1;
	$scope.hideMore = false;
	$scope.loadNamespaceList = function(){
		$scope.loadingMore = true;
		NamespaceService.namespaceList({"page": $scope.page}, function(r_namespaceList){
			for(let i in r_namespaceList){
				let item = r_namespaceList[i];
				r_namespaceList[i].timeStamp = fmtDate(item.timeStamp);
				if(!item.mosaicAmount || item.mosaicAmount==0){
					r_namespaceList[i].mosaicAmount = "";
				} else {
					r_namespaceList[i].class = "cursorPointer";
				}
			}
			if($scope.namespaceList){
				$scope.namespaceList = $scope.namespaceList.concat(r_namespaceList);
			} else {
				$scope.namespaceList = r_namespaceList;
			}
			if(r_namespaceList.length==0 || r_namespaceList.length<100){
				$scope.hideMore = true;
			}
			$scope.loadingMore = false;
		});
	};
	$scope.showMosaicList = function(index, $event){
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		let mosaicList = $scope.namespaceList[index].mosaicList;
		if(mosaicList && mosaicList.length!=0){
			for(let i in mosaicList){
				let mosaic = mosaicList[i];
				mosaic.initialSupply = fmtSplit(mosaic.initialSupply);
				if(mosaic.transferable=="true")
					mosaic.transferable = "Yes";
				else
					mosaic.transferable = "No";
			}
			$scope.mosaicList = mosaicList;
			$("#mosaicListModule").modal("show");
		}
	};
	$scope.loadMore = function(){
		$scope.page++;
		$scope.loadNamespaceList();
	};
	$scope.loadNamespaceList();
}