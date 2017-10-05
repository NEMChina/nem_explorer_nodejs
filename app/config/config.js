const config = {
	port: 8081,
	mongodb: 'mongodb://localhost/explorer',
	nisHost: '127.0.0.1',
	nisPort: '7890',
	wsPort: '7778',
	wsPath: '/w/messages',
	hugeAliceNisHost: 'hugealice.nem.ninja',
	supernodeHost: 'https://supernodes.nem.io',
	supernodeDataUrl: 'https://supernodes.nem.io/nodes',
	supernodePayoutAccount: 'NCPAYOUTH2BGEGT3Q7K75PV27QKMVNN2IZRVZWMD',
	apostilleAccount: 'NCZSJHLTIMESERVBVKOW6US64YDZG2PFGQCSV23J',
	pollAccount: 'NAZN26HYB7C5HVYVJ4SL3KBTDT773NZBAOMGRFZB',
	nisInitStartBlock: 0, //default 0
	network: 68 // 68-mainnet, 98-testnet 
}

module.exports = config;