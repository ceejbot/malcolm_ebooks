#!/usr/bin/env node

require('dotenv').config();
var
	ellipsize = require('ellipsize'),
	fs        = require('fs'),
	shuffle   = require('knuth-shuffle').knuthShuffle,
	Twit      = require('twit')
	;

function log(msg)
{
	console.log([new Date(), msg].join(' '));
}

function readInTheLines()
{
	var lines = fs.readFileSync('./curated.txt', 'ascii').split('\n');
	shuffle(lines);
	log('--- read in ' + lines.length + ' messages to choose from');
	return lines;
}

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

var malcolm = readInTheLines();
function chooseLine(len)
{
	var text = malcolm.pop();
	// reset if we've expended them all
	if (malcolm.length < 1)
		malcolm = readInTheLines();
	return ellipsize(text, len || 140);
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

	var prefix = '@' + tweet.user.screen_name + ' ';
	var text = chooseLine(140 - prefix.length);

	var toot = {
		status: prefix + text,
		in_reply_to_status_id: tweet.id_str
	};

	postTweet(toot);
});

mentions.on('error', function handleMentionsError(err)
{
	log('mentions error: ' + err);
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
		var toot = { status: chooseLine(118), media_ids: [ imageID ] };
		postTweet(toot);
	});
}

// Bollocking the air around him.
function postPeriodically()
{
	if (images.length && Math.floor(Math.random() * 100) < 12)
		return postImage();

	postTweet({ status: chooseLine() });
}

log('Malcolm Tucker coming online.');
postPeriodically();
setInterval(postPeriodically, 150 * 60 * 1000); // once every 2.5 hours
