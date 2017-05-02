# malcolm_ebooks

[![Greenkeeper badge](https://badges.greenkeeper.io/ceejbot/malcolm_ebooks.svg)](https://greenkeeper.io/)

[Malcolm Tucker](https://en.wikipedia.org/wiki/Malcolm_Tucker) markov-chains twitter bot. Not polite in any way.

## Usage

Clone the repo; run `npm install`. Create a file named `.env` in the repo directory and put your Twitter API access tokens in it like so:

```sh
TWITTER_CONSUMER_KEY=your-key
TWITTER_CONSUMER_SECRET=your-secret
TWITTER_ACCESS_TOKEN=you-token
TWITTER_ACCESS_TOKEN_SECRET=your-secret
```

Optionally, make a subdirectory named `images` and toss in a few animated gifs of Malcolm in action. He will post a randomly-selected image every so often, along with a randomly-generated comment. No attempt is made to filter files in the `images` directory for actual images.

Then run `npm start`. Malcolm will now be online and swearing incoherently.

## License

ISC
