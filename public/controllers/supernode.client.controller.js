angular.module("webapp").controller("SupernodeController", ["$scope", "SupernodeService", SupernodeController]);

function SupernodeController($scope, SupernodeService){
	$scope.changeSelectOption = function(){
		if(!$scope.select.value)
			return;
		SupernodeService.payoutList({"round": $scope.select.value}, function(r_payoutList) {
			if(!r_payoutList){
				$scope.payoutList = [];
				return;
			}
			for(let i in r_payoutList) {
				let payout = r_payoutList[i];
				payout.round = (payout.round-3) + "-" + payout.round;
				let sender = "<a href='s_account.html?account="+payout.sender+"' target='_blank'>"+payout.sender+"</a>";
				let recipient = "<a href='s_account.html?account="+payout.recipient+"' target='_blank'>"+payout.recipient+"</a>";
				payout.senderAndRecipient = sender + "<br/>" + recipient;
				payout.amount = fmtXEM(payout.amount);
				payout.fee = fmtXEM(payout.fee);
				payout.timeStamp = fmtDate(payout.timeStamp);
			}
			$scope.payoutList = r_payoutList;
		});
	}
	SupernodeService.payoutRoundList(function(r_payoutRoundList){
		if(!r_payoutRoundList)
			return;
		$scope.selectOptions = r_payoutRoundList;
		$scope.select = $scope.selectOptions[0];
		$scope.changeSelectOption();
	});
}