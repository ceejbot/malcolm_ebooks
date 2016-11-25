#!/usr/bin/env node

require('dotenv').config();
var
	ellipsize = require('ellipsize'),
	fs        = require('fs'),
	shuffle   = require('knuth-shuffle').knuthShuffle,
	Twit      = require('twit')
	;

const INTERVAL = 180 * 60 * 1000; // once every 3 hours
const LAST_POST_FILE = '.lastpost';
var friends = [];

const TIM_IN_RUISLIP = 'https://www.youtube.com/watch?v=6GT18lYRRDQ';

function log(msg)
{
	console.log([new Date(), msg].join(' '));
}

function readInTheLines()
{
	var lines = fs.readFileSync('./curated.txt', 'ascii').trim().split('\n');
	shuffle(lines);
	log('--- ' + lines.length + ' messages read & shuffled');
	return lines;
}

function readInTheImages()
{
	var imgs = [];
	try
	{
		imgs = fs.readdirSync('./images');
		shuffle(imgs);
		log('--- ' + imgs.length + ' images read');

	}
	catch(ex) {}

	return imgs;
}

var config = {
	consumer_key:         process.env.TWITTER_CONSUMER_KEY,
	consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
	access_token:         process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
	timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
};
var T = new Twit(config);

var images = readInTheImages();
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
		{
			log('tweet id=' + data.id_str + '; ' + toot.status);
			fs.writeFileSync(LAST_POST_FILE, (new Date()).toString());
		}
	});
}

function follow(id, callback)
{
	var opts = {
		user_id: id,
		follow: true,
	};

	T.post('friendships/create', opts, callback);
}

var userstream = T.stream('user');

// Bollock whoever @-mentioned him.
userstream.on('tweet', function handleMention(tweet)
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

userstream.on('error', function handleMentionsError(err)
{
	log('userstream error: ' + err);
});

userstream.on('follow', function handleFollow(event)
{
	if (event.source.screen_name === 'malcolm_ebooks') return;

	log(`followed by ${event.source.screen_name} ${event.source.id}`);
	follow(event.source.id, function(err, result)
	{
		if (err) return log(err);

		var prefix = '@' + event.source.screen_name + ' ';
		var text = chooseLine(140 - prefix.length);

		postTweet({ status: prefix + text });
	});
});

userstream.on('unfollow', function handleUnfollow(event)
{
	log(`unfollowed by ${event.source.screen_name} ${event.source.id}`);
	var opts = { user_id: event.source.id };
	T.post('friendships/destroy', opts, function(err, result)
	{
		if (err) log(err);
	});
});

userstream.once('friends', function handleFriendsList(event)
{
	friends = event.friends.map((i) => String(i));

	// follow everybody who's following him right now
	T.get('followers/ids', function(err, followers)
	{
		if (err) return log(err);
		followers.ids.forEach(function(id)
		{
			if (friends.indexOf(id) === -1)
			{
				follow(id, log);
			}
		});
	});
});

function postImage()
{
	var img = images.pop();
	// reset if we've expended them all
	if (images.length < 1)
		images = readInTheImages();

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
		var toot = { status: chooseLine(), media_ids: [ imageID ] };
		postTweet(toot);
	});
}

// Bollocking the air around him.
function postPeriodically()
{
	if (images.length && Math.floor(Math.random() * 100) < 12)
		return postImage();

	var line = chooseLine(140);
	if (line.match(/Ruislip/))
		line += ' ' + TIM_IN_RUISLIP;

	postTweet({ status: line });
}

log('Malcolm Tucker coming online.');

var postNow = false;
try
{
	var lastPost = new Date(fs.readFileSync(LAST_POST_FILE, 'ascii'));
	postNow = (Date.now() - lastPost.getTime()) >= INTERVAL / 2;
}
catch (e) { postNow = true; }

if (postNow) postPeriodically();
setInterval(postPeriodically, INTERVAL);
