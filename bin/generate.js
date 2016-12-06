#!/usr/bin/env node

var
	Chains     = require('markov-chains-text').default,
	fs         = require('fs')
	;

var source = fs.readFileSync('./malcolm.txt', 'ascii');
var fakeMalc = new Chains(source);

for (var i = 0; i < 1000; i++)
{
	var sentence = fakeMalc.makeSentence();
	console.log(sentence);
}
