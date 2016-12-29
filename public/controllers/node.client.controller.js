angular.module("webapp").controller("NodeController", ["$scope", "NodeService", NodeController]);

function NodeController($scope, NodeService){
	NodeService.nodeList(function(r_nodeList){
		$scope.nodeList = r_nodeList;
		for(let index in $scope.nodeList){
			let item = $scope.nodeList[index]
			$scope.nodeList[index].name = XBBCODE.process({
				text: $scope.nodeList[index].name,
				removeMisalignedTags: true,
				addInLineBreaks: false
			}).html;
		}
	});
}