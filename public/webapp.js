let webapp = angular.module("webapp", ['ngRoute', 'ngAnimate', 'ngCookies', 'infinite-scroll']);

//disable the cache
webapp.config(["$httpProvider", function($httpProvider) {
    if( !$httpProvider.defaults.headers.get ) {
        $httpProvider.defaults.headers.get = {};
    }
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
}]);

webapp.filter('to_trusted', ['$sce', function ($sce) {
	return function (text) {
	    return $sce.trustAsHtml(text);
	};
}]);

webapp.config(function($routeProvider) {
    $routeProvider
    	.when('/', {
            templateUrl: 'blocklist.html',
            controller: 'BlockController'
        })
        .when('/accountlist', {
            templateUrl: 'accountlist.html',
            controller: 'AccountController'
        })
        .when('/harvesterlist', {
            templateUrl: 'harvesterlist.html',
            controller: 'HarvesterController'
        })
        .when('/harvestingCalculator', {
            templateUrl: 'harvestingCalculator.html',
            controller: 'HarvestingCalculatorController'
        })
        .when('/blocklist', {
            templateUrl: 'blocklist.html',
            controller: 'BlockController'
        })
        .when('/mosaictransfer', {
            templateUrl: 'mosaictransfer.html',
            controller: 'MosaicTransferController'
        })
        .when('/mosaiclist', {
            templateUrl: 'mosaiclist.html',
            controller: 'MosaicListController'
        })
        .when('/mosaic', {
            templateUrl: 'mosaic.html',
            controller: 'MosaicController'
        })
        .when('/namespacelist', {
            templateUrl: 'namespacelist.html',
            controller: 'NamespaceListController'
        })
        .when('/namespace', {
            templateUrl: 'namespace.html',
            controller: 'NamespaceController'
        })
        .when('/nodelist', {
            templateUrl: 'nodelist.html',
            controller: 'NodeController'
        })
        .when('/txlist', {
            templateUrl: 'txlist.html',
            controller: 'TXController'
        })
        .when('/unconfirmedtxlist', {
            templateUrl: 'unconfirmedtxlist.html',
            controller: 'UnconfirmedTXController'
        })
        .when('/supernodepayout', {
            templateUrl: 'supernodepayout.html',
            controller: 'SupernodeController'
        })
        .when('/supernodepayout_custom', {
            templateUrl: 'supernodepayout_custom.html',
            controller: 'SupernodeCustomController'
        })
        .when('/polllist', {
            templateUrl: 'polllist.html',
            controller: 'PollListController'
        })
        .when('/poll', {
            templateUrl: 'poll.html',
            controller: 'PollController'
        })
        .when('/s_account', {
            templateUrl: 's_account.html',
            controller: 'SearchAccountController'
        })
        .when('/s_block', {
            templateUrl: 's_block.html',
            controller: 'SearchBlockController'
        })
        .when('/s_tx', {
            templateUrl: 's_tx.html',
            controller: 'SearchTXController'
        })
        .when('/logs', {
            templateUrl: 'logs.html'
        });
});