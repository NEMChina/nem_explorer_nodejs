angular.module("webapp").controller("FooterController", ["$scope", "FooterService", FooterController]);

function FooterController($scope, FooterService){
	$scope.loadPrice = function(){
		FooterService.market(function(r_market){
			if(!r_market || !r_market.btc || !r_market.usd || !r_market.cap)
				return;
			$scope.price = "$"+r_market.usd+" (" + r_market.btc + " btc)";
			$scope.marketCap = "$"+fmtSplit(Math.round(r_market.cap));
		});
	};
	$scope.loadPrice();
}