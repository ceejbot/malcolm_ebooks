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

var images = [
	'https://cldup.com/GPKVT0aMab.gif',
	'https://cldup.com/GPKVT0aMab.gif',
	'https://cldup.com/yj7B8tDKay.gif',
	'https://cldup.com/J7L4NMKluV.gif',
	'https://cldup.com/tm1RRlJ5Ha.gif',
	'https://cldup.com/PDgELDFSnC.gif',
	'https://cldup.com/XIXBQwflxg.gif',
	'https://cldup.com/2Sy8ksoCOi.gif',
	'https://cldup.com/AFgESltoJS.gif',
	'https://cldup.com/uleFKn9V_Z.gif',
	'https://cldup.com/-ioHC8crZo.gif',
	'https://cldup.com/5PyEHj92mZ.gif',
	'https://cldup.com/oZn3AVBWDw.gif',
	'https://cldup.com/XOAeZYVuEY.gif',
	'https://cldup.com/7K-hOxq_Qn.gif',
	'https://cldup.com/jHbcjzdsbM.gif',
	'https://cldup.com/yfwUs2slQN.gif',
	'https://cldup.com/8PwyswEIIj.gif',
	'https://cldup.com/NtvUeudPtg.gif',
	'https://cldup.com/wXJFH2gymD.gif',
	'https://cldup.com/niAdS6MTkK.gif',
	'https://cldup.com/rY4wtzACVJ.gif',
	'https://cldup.com/y1vNYg0H35.gif',
	'https://cldup.com/MkH_23sL2v.gif',
	'https://cldup.com/CF_JPWow5V.gif',
	'https://cldup.com/ZYZg0FDyro.gif',
	'https://cldup.com/HAEPMKmbFq.gif',
	'https://cldup.com/CnIPLooZn4.gif',
	'https://cldup.com/EwN8JNtMR9.gif',
	'https://cldup.com/bfVbheboXU.gif',
	'https://cldup.com/cUe4BJycOl.gif',
	'https://cldup.com/QYGkUf4u4Q.jpg',
	'https://cldup.com/zXuLoodveT.gif',
	'https://cldup.com/RgiAksi8d1.gif',
	'https://cldup.com/9Yd3bCtqn8.gif',
	'https://cldup.com/z7CPHe31OA.gif',
	'https://cldup.com/ii5VSN9Zhy.gif',
	'https://cldup.com/-HKeqySr7v.gif',
	'https://cldup.com/tSQVp7cquE.gif',
	'https://cldup.com/GzRM7V4m9H.jpg',
	'https://cldup.com/vgONX4N5xr.gif',
	'https://cldup.com/c21SYxKwIs.gif',
	'https://cldup.com/QD66e0TtWL.gif',
	'https://cldup.com/EdZN9XcoUW.gif',
	'https://cldup.com/dfKjnWyF4R.gif',
	'https://cldup.com/096Vp1Vfe2.gif',
	'https://cldup.com/8wsDxiGICq.gif',
	'https://cldup.com/-HitbOdNco.gif',
	'https://cldup.com/Ces-hAKpv1.gif',
	'https://cldup.com/fVAWtFxeFF.gif',
	'https://cldup.com/MqvaVflowZ.gif',
	'https://cldup.com/_HteU_MWnN.gif',
	// marker
	'https://cldup.com/3Pfht6mu-M.gif',
	'https://cldup.com/7dO80Hq9_w.gif',
	'https://cldup.com/mWd_69vd9m.gif',
	'https://cldup.com/5ER8kx23Hv.jpg',
	'https://cldup.com/8JATbSqFdY.gif',
	'https://cldup.com/cJlH2j7VPQ.gif',
	'https://cldup.com/yJZDnc3yfB.gif',
	'https://cldup.com/_ZHqyDEWkf.jpg',
	'https://cldup.com/c6ZJKuVy_R.gif',
	'https://cldup.com/VmyCd9ov74.jpg',
	'https://cldup.com/XEEWQRLwZB.gif',
	'https://cldup.com/R2qfO8AK7d.gif',
	'https://cldup.com/YHvIaVCYmL.gif',
	'https://cldup.com/kvtp6q2Dfw.gif',
	'https://cldup.com/XDv_d8bjqE.gif',
	'https://cldup.com/8lBrPHO-XJ.jpg',
	'https://cldup.com/G2NfBuF5gT.gif',
	'https://cldup.com/18SjDA-U6Q.gif https://cldup.com/cXhs8Xp5gN.gif', // yes, two in one
	'https://cldup.com/OG7xlzH3xl.gif', // tinker tailor
];

function log(msg)
{
	console.log([new Date(), msg].join(' '));
}

// Bollock whoever @-mentioned him.
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
			log(err);
		else
			log('reply posted; id=' + data.id_str + '; ' + text);
	});
});

// Bollocking the air around him.
function postPeriodically()
{
	var text;
	if (Math.floor(Math.random() * 100) < 10)
		text = images[Math.floor(Math.random() * images.length)];
	else
		text = fakeMalc.makeSentence().substring(0, 140);

	T.post('statuses/update', { status: text }, function handlePostResponse(err, data, res)
	{
		if (err)
			log(err);
		else
			log('tweet posted; id=' + data.id_str + '; ' + text);
	});
}

log('Malcolm Tucker coming online.');
postPeriodically();
setInterval(postPeriodically, 180 * 60 * 1000); // once every three hours
