angular.module("webapp").controller("NamespaceController", ["$scope", "NamespaceService", NamespaceController]);

function NamespaceController($scope, NamespaceService){
	$scope.page = 1;
	$scope.hideMore = false;
	$scope.loadingMore = true;
	$scope.loadNamespaceList = function(){
		NamespaceService.namespaceList({"page": $scope.page}, function(r_namespaceList){
			r_namespaceList.forEach((item, index) => {
				r_namespaceList[index].timeStamp = fmtDate(item.timeStamp);
				if(!item.mosaicAmount || item.mosaicAmount==0){
					r_namespaceList[index].mosaicAmount = "";
				} else {
					r_namespaceList[index].class = "cursorPointer";
				}
			});
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
			mosaicList.forEach(mosaic => {
				if(mosaic.transferable=="true")
					mosaic.transferable = "Yes";
				else
					mosaic.transferable = "No";
			});
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