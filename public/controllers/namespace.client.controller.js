angular.module("webapp").controller("NamespaceController", ["$scope", "$timeout", "NamespaceService", NamespaceController]);

function NamespaceController($scope, $timeout, NamespaceService){
	$scope.rootNamespaceList = function(){
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
	};
	$scope.rootNamespaceList();
}