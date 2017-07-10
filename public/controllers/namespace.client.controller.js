angular.module("webapp").controller("NamespaceController", ["$scope", "$timeout", "NamespaceService", NamespaceController]);

function NamespaceController($scope, $timeout, NamespaceService){
	$scope.loadNamespaceList = function(){
		NamespaceService.namespaceList(function(r_namespaceList){
			for(let i in r_namespaceList){
				let item = r_namespaceList[i];
				r_namespaceList[i].timeStamp = fmtDate(item.timeStamp);
				if(r_namespaceList[i].mosaic)
					r_namespaceList[i].mosaic.initialSupply = fmtSplit(r_namespaceList[i].mosaic.initialSupply);
				if(!item.mosaicAmount || item.mosaicAmount==0){
					r_namespaceList[i].mosaicAmount = "";
				} else {
					r_namespaceList[i].class = "cursorPointer";
				}
			}
			$scope.namespaceList = r_namespaceList;
		});
		// load dataTable
		$timeout(function() {
			$('#namespaceTable').DataTable({
		    	"paging": false,
		        "ordering": false,
		        "searching": true,
		        "columnDefs": [
					{"searchable": false, "targets": 0},
					{"searchable": false, "targets": 3},
					{"searchable": false, "targets": 4},
					{"searchable": false, "targets": 5}
				]
	    	});
		}, 1000);
	};
	$scope.showMosaicList = function(index, $event, namespace, mosaicAmount){
		//just skip the action when click from <a>
		if($event!=null && $event.target!=null && $event.target.className.indexOf("noDetail")!=-1){
			return;
		}
		if(!mosaicAmount || mosaicAmount==0){
			return;
		}
		$scope.selectedNamespace = namespace;
		NamespaceService.mosaicListByNamespace({"namespace": namespace}, function(r_mosaicList){
			for(let i in r_mosaicList){
				let mosaic = r_mosaicList[i];
				if(mosaic.transferable=="true")
					mosaic.transferable = "Yes";
				else
					mosaic.transferable = "No";
			}
			$scope.mosaicList = r_mosaicList;
			$("#mosaicListModule").modal("show");
		});
	};
	$scope.loadNamespaceList();
}