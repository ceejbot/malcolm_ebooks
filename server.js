#!/usr/bin/env node

require('dotenv').config();
var
	Chains = require('markov-chains-text').default,
	fs     = require('fs'),
	Twit   = require('twit')
	;

var source = fs.readFileSync('./malcolm.txt', 'ascii');
var fakeMalc = new Chains(source);

var config = {
	consumer_key:         process.env.TWITTER_CONSUMER_KEY,
	consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
	access_token:         process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
	timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
};
var T = new Twit(config);

// Auto-responder
var mentions = T.stream('user');
mentions.on('tweet', function handleMention(tweet)
{
	if (tweet.in_reply_to_screen_name !== 'malcolm_ebooks')
		return;

	var seed = tweet.text.replace(/@malcolm_ebooks/g, '').trim();
	var text = fakeMalc.makeSentence(seed);
	if (typeof text !== 'string')
		text = fakeMalc.makeSentence();

	text = '@' + tweet.user.screen_name + ' ' + text;
	var toot = {
		status: text.substring(0, 140),
		in_reply_to_status_id: tweet.id_str
	};

	T.post('statuses/update', toot, function handleMentionResponse(err, data, res)
	{
		if (err)
			console.error(err);
		else
			console.log('reply posted; id=' + data.id_str + '; ' + text);
	});
});

function postPeriodically()
{
	var text = fakeMalc.makeSentence().substring(0, 140);
	T.post('statuses/update', { status: text }, function handlePostResponse(err, data, res)
	{
		if (err)
			console.error(err);
		else
			console.log('tweet posted; id=' + data.id_str + '; ' + text);
	});
}

console.log('Malcolm Tucker coming online.');
postPeriodically();
setTimeout(postPeriodically, 60 * 60 * 1000); // once an hour
