import PollController from '../controllers/poll.server.controller';

module.exports = function(app){
	app.route('/poll/list').post(PollController.pollList);
	app.route('/poll/answers').post(PollController.pollAnswers);
};