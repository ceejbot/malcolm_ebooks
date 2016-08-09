#!/usr/bin/env node

require('dotenv').config();
var
	Chains    = require('markov-chains-text').default,
	ellipsize = require('ellipsize'),
	fs        = require('fs'),
	Twit      = require('twit')
	;

var source = fs.readFileSync('./malcolm.txt', 'ascii');
var fakeMalc = new Chains(source);

var images = [];
try { images = fs.readdirSync('./images'); }
catch(ex) {}

var config = {
	consumer_key:         process.env.TWITTER_CONSUMER_KEY,
	consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
	access_token:         process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
	timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
};
var T = new Twit(config);

function log(msg)
{
	console.log([new Date(), msg].join(' '));
}

function postTweet(toot)
{
	T.post('statuses/update', toot, function handleTootResponse(err, data, res)
	{
		if (err)
			log(err);
		else
			log('tweet id=' + data.id_str + '; ' + toot.status);
	});
}

// Bollock whoever @-mentioned him.
var mentions = T.stream('user');
mentions.on('tweet', function handleMention(tweet)
{
	if (tweet.in_reply_to_screen_name !== 'malcolm_ebooks')
		return;

	var text = fakeMalc.makeSentence();

	text = '@' + tweet.user.screen_name + ' ' + text;
	var toot = {
		status: text.substring(0, 140),
		in_reply_to_status_id: tweet.id_str
	};

	postTweet(toot);
});

mentions.on('error', function handleMentionsError(err)
{
	log('mentions error: ' + err.message());
});

function postImage()
{
	var img = images[Math.floor(Math.random() * images.length)];

	T.postMediaChunked({ file_path: './images/' + img }, function handleMediaPosted(err, data, response)
	{
		if (err)
		{
			log('error posting image file: ' + img);
			log(err);
			return;
		}

		var imageID = data.media_id_string;
		log('image uploaded; id=' + imageID);
		var text = ellipsize(fakeMalc.makeSentence(), 120);
		var toot = { status: text, media_ids: [ imageID ] };
		postTweet(toot);
	});
}

// Bollocking the air around him.
function postPeriodically()
{
	if (images.length && Math.floor(Math.random() * 100) < 150)
		return postImage();

	var text = ellipsize(fakeMalc.makeSentence(), 140);
	postTweet({ status: text });
}

log('Malcolm Tucker coming online.');
postPeriodically();
setInterval(postPeriodically, 180 * 60 * 1000); // once every three hours
