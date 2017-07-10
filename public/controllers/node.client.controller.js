angular.module("webapp").controller("NodeController", ["$scope", "$timeout", "NodeService", NodeController]);

function NodeController($scope, $timeout, NodeService){
	NodeService.nodeList(function(r_nodeList){
		$scope.nodeList = r_nodeList;
		for(let index in $scope.nodeList){
			let item = $scope.nodeList[index];
			if($scope.nodeList[index].name){
				$scope.nodeList[index].name = XBBCODE.process({
					text: $scope.nodeList[index].name,
					removeMisalignedTags: true,
					addInLineBreaks: false
				}).html;
			}
		}
		// load dataTable
		$timeout(function() {
			$('#nodeTable').DataTable({
		    	"paging": false,
		        "ordering": false,
		        "searching": true,
		        "columnDefs": [
					{"searchable": false, "targets": 0},
					{"searchable": false, "targets": 4},
				]
	    	});
		}, 1000);
	});
}