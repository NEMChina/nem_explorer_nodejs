angular.module("webapp").controller("NamespaceListController", ["$scope", "$timeout", "NamespaceService", NamespaceListController]);
angular.module("webapp").controller("NamespaceController", ["$scope", "$timeout", "$location", "NamespaceService", NamespaceController]);

function NamespaceListController($scope, $timeout, NamespaceService){
	NamespaceService.rootNamespaceList(function(r_namespaceList){
		r_namespaceList.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.expiredTime = fmtDate(r.expiredTime);
		});
		$scope.namespaceList = r_namespaceList;
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
		}, 500);
	});
}

function NamespaceController($scope, $timeout, $location, NamespaceService){
	let absUrl = $location.absUrl();
	if(absUrl==null)
		return;
	let reg = /ns=([a-zA-Z0-9_-]+((\.)[a-zA-Z0-9_-]+)*)/;
	if(!absUrl.match(reg) || absUrl.match(reg).length<2)
		return;
	let ns = absUrl.match(reg)[1];
	let params = {ns: ns};
	NamespaceService.namespaceListbyNamespace(params, function(r_namespaceList){
		r_namespaceList.forEach((r, index) => {
			r.timeStamp = fmtDate(r.timeStamp);
			r.expiredTime = fmtDate(r.expiredTime);
		});
		$scope.namespaceList = r_namespaceList;
		$scope.select = $scope.namespaceList[0];
	});
}


