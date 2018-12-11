import PollController from '../controllers/poll.server.controller';

module.exports = function(app){
	app.route('/poll/list').post(PollController.pollList);
	app.route('/poll/poll').post(PollController.poll);
	app.route('/poll/pollResult').post(PollController.pollResult);
	app.route('/poll/pollResultVoters').post(PollController.pollResultVoters);
};