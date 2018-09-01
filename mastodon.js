#!/usr/bin/env node

require('dotenv').config();
const
	ellipsize = require('ellipsize'),
	fs        = require('fs'),
	shuffle   = require('knuth-shuffle').knuthShuffle,
	Mastodon  = require('mastodon-api')
	;

const INTERVAL = 180 * 60 * 1000; // once every 3 hours
const LAST_POST_FILE = '.lastmasto';
const POST_LEN = 500;

const TIM_IN_RUISLIP = 'https://www.youtube.com/watch?v=6GT18lYRRDQ';

function log(msg)
{
	console.log([new Date(), msg].join(' '));
}

function readInTheLines()
{
	const lines = fs.readFileSync('./curated.txt', 'ascii').trim().split('\n');
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
	catch (ex) {}

	return imgs;
}

const config = {
	api_url     : process.env.MASTO_URL + '/api/v1/',
	access_token: process.env.MASTO_TOKEN
};
const M = new Mastodon(config);

let images = readInTheImages();
let malcolm = readInTheLines();
function chooseLine(len)
{
	var text = malcolm.pop();
	// reset if we've expended them all
	if (malcolm.length === 0)
		malcolm = readInTheLines();
	return ellipsize(text, len || POST_LEN);
}

async function postToot(toot)
{
	try
	{
		const response = await M.post('statuses', toot);
		log(`posted a toot: ${response.data.url}`);
		log(response.data.content);
		fs.writeFileSync(LAST_POST_FILE, (new Date()).toString());
	}
	catch (err)
	{
		log(err.message);
	}
}

async function postImage()
{
	const img = images.pop();
	// reset if we've expended them all
	if (images.length === 0)
		images = readInTheImages();

	try
	{
		const response = await M.post('media', { file: fs.createReadStream(`./images/${img}`), description: img });
		console.log(response.data);
		const imageID = response.data.id;
		log('image uploaded; id=' + imageID);
		const toot = { status: chooseLine(), media_ids: [imageID] };
		postToot(toot);
	}
	catch (err)
	{
		log(err.message);
	}
}

// Bollocking people who dare talk to him.
const listener = M.stream('streaming/user');

listener.on('message', message =>
{
	if (message.event !== 'notification') return;
	if (message.data.type !== 'mention') return;

	const prefix = `@${message.data.status.account.acct} `;
	const text = chooseLine(POST_LEN - prefix.length);

	const reply = {
		in_reply_to_id: message.data.status.id,
		visibility: message.data.status.visibility,
		status: prefix + text
	};
	postToot(reply);
});

listener.on('error', err => console.log(err));

// Bollocking the air around him.
function postPeriodically()
{
	if (images.length > 0 && Math.floor(Math.random() * 100) < 15)
		return postImage();

	var line = chooseLine(POST_LEN);
	if (line.match(/Ruislip/) && Math.floor(Math.random() * 100) < 25)
		line += ' ' + TIM_IN_RUISLIP;

	postToot({ status: line, spoiler_text: 'Tuckerisms' });
}

log('Malcolm Tucker coming online.');

let postNow = false;
try
{
	const lastPost = new Date(fs.readFileSync(LAST_POST_FILE, 'ascii'));
	postNow = (Date.now() - lastPost.getTime()) >= INTERVAL / 2;
}
catch (e) { postNow = true; }

if (postNow) postPeriodically();
else log('waiting to post later');
setInterval(postPeriodically, INTERVAL);
