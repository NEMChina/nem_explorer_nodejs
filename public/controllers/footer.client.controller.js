angular.module("webapp").controller("FooterController", ["$scope", "FooterService", FooterController]);

function FooterController($scope, FooterService){
	// load market info
	FooterService.market(function(r_market){
		if(!r_market || !r_market.btc || !r_market.usd || !r_market.cap)
			return;
		$scope.price = "$"+r_market.usd+" (" + r_market.btc + " btc)";
		$scope.marketCap = "$"+fmtSplit(Math.round(r_market.cap));
	});
	// load version info
	FooterService.version(function(r_version){
		if(r_version && r_version.version)
			$scope.version = r_version.version;
	});
}