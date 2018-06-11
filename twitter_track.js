"use strict";

let Twitter = require( "twitter-lite" );

//
// Some configuration details; twitterKeys from developer account => environment
//
let config = {

	updateIntervalSecs: 1,
	timeoutSecs: 30, // Twitter suggests reconnecting after 30s with no data.
	stringPadding: 20,

	twitterFilters: {
		track: [],
//		follow: undefined,
//		locations: undefined,
	},

	twitterKeys: {
		subdomain: "api",
		consumer_key:        process.env.TWITTER_CONSUMER_KEY,
		consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
		access_token_key:    process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
	}
};


//
// Simple object to count occurrences of specific terms
//
class TermTracker {

	constructor( terms ) {
		this.missed = 0;
		this.history = [];
		this.term_counts = {};
		for( let term of terms ) {
			this.term_counts[term] = 0;
		}
	}

	_padString( str, len ) {
		let padded = " ".repeat(len) + str;
		return padded.slice( -len );
	}

	clearCounts() {
		let c = {}
		for( let term in this.term_counts ) { c[term] = 0; }
		this.term_counts = c;
	}

	startEpoch() {
		this.start = new Date();
	}

	endEpoch() {
		this.history.push({
			term_counts: this.term_counts,
			missed: this.missed,
			start:  this.start,
			end:    new Date(),
		});
		this.clearCounts();
	}

	processText( text ) {
		for( let term in this.term_counts ) {
			if( text.includes(term) ) {
				this.term_counts[term] += 1;
			}
		}
	}

	getHeaderLine( padding, term_counts = undefined ) {
		term_counts = term_counts || this.term_counts;
		let line = "";
		line += this._padString( "Time:D/M/Y:GMT", 20 );
		line += this._padString( "interval/s", padding );
		line += this._padString( "missed", padding );
		for( let term in term_counts ) { line += this._padString( "\""+term+"\"", padding ); }
		return line;
	}

	getCountLine( padding, interval_s=undefined, term_counts=undefined, missed=undefined ) {
		let now = new Date();
		interval_s = interval_s || (now.getTime()-this.start.getTime())/1000;
		term_counts = term_counts || this.term_counts;
		missed = missed || this.missed;
		let line = "";
		{
			let d = this.start, l = '';
			l += [d.getUTCDate(),d.getUTCMonth(),d.getUTCFullYear()].join('/');
			l += ' ';
			l += [d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()].join(':');
			line += this._padString( l, 20 );
		}
		line += this._padString( interval_s.toString(), padding );
		line += this._padString( missed.toString(), padding );
		for( let term in term_counts ) {
			const n = term_counts[term];
			line += this._padString( n.toString(), padding );
		}
		return line;
	}

	printTabulated( padding, lastN = 0 )
	{
		const pad = (padding<10) ? (10) : (padding);
		const maxN = this.history.length;
		const N = (lastN>maxN) ? (maxN) : (lastN);

		console.log( this.getHeaderLine( pad ) );

		if( this.start )
		{
			const line = this.getCountLine( pad );
			console.log( line );			
		}

		for( let i=maxN-1; i>(maxN-N)-1; i-- )
		{
			const entry = this.history[i];
			const interval_s = (entry.end.getTime()-entry.start.getTime())/1000;
			const line = this.getCountLine( pad, interval_s, entry.counts, entry.missed );
			console.log( line );
		}
		console.log( "" );
	}
}


//
// Interface into Twitter stream
//
class TwitterStreamClient {

	constructor() {
		this.client = undefined;
		this.timestamp = undefined;

		this.heartbeat = function() {
			this.timestamp = new Date();
		}
	}

	isRunning() {
		return (this.timestamp===undefined) ? (false) : (true);
	}

	secondsSinceInput() {
		if( ! this.isRunning() ) {
			console.log( "Problem: not running!" );
			return 0;
		}
		let now = new Date();
		return (now.getTime()-this.timestamp.getTime())/1000;
	}

	launch( config, termTracker ) {

		this.client = new Twitter( config.twitterKeys );

		//
		// If we have valid data coming in, then process it.
		// Otherwise, we've got an error or a heartbeat signal.
		//
		this.client.stream( "statuses/filter", config.twitterFilters )
		.on( "start", response => {
			this.heartbeat();
			termTracker.startEpoch();
		})
		.on( "data", data => {
			this.heartbeat();
			if( data.text ) {
				termTracker.processText( data.text );
			}
			else if( "limit" in data ) {
				termTracker.missed = Math.max( data.limit.track, termTracker.missed );
			}
		})
		.on( "ping",      () => { this.heartbeat(); console.log( "Ping!" ); })
		.on( "error",  error => { this.timestamp = undefined; console.log( "Error:", error ); })
		.on( "end", response => { this.timestamp = undefined; console.log( "Ending:", response ); });
	}
}


//
// Get command line parameters
//
{
	const args = process.argv;

	if( args.length < 3 ) {
		console.log( "" );
		console.log( "Usage: node %s <update interval> term1 [term2 ...]", args[0] );
		console.log( "" );
		console.log( "Where:" );
		console.log( " - update interval: in seconds" );
		console.log( " - term list: space-separated list of terms (quote if needed)" );
		console.log( "" );
		process.exit( -1 );
	}

	config.updateIntervalSecs = parseInt( args[2] );
	config.twitterFilters.track = args.slice( 3 );

	// catches NaN, -Inf, +Inf
	if( !isFinite(config.updateIntervalSecs) ) {
		console.log( "Unable to convert '%s' into an integer.", args[2] );
		process.exit( -1 );
	}
}


//
// Adjust string padding if needed; +3 includes quote marks and a space
//
for( let t of config.twitterFilters.track ) {
	config.stringPadding = Math.max( config.stringPadding, t.length+3 );
}


//
// Core objects we're using
//
let termTracker = new TermTracker( config.twitterFilters.track );
console.log( termTracker.getHeaderLine( config.stringPadding ) );

let streamClient = new TwitterStreamClient();
streamClient.launch( config, termTracker );


//
// Invoke looping tick function after some delay (includes printout)
//
setTimeout( Tick, config.updateIntervalSecs*1000 );


//
// Tick function - update term stats and print some info. Also checks
// heartbeat, and relaunches if needed.
//
function Tick() {

	if( streamClient.isRunning() ) {
		if( streamClient.secondsSinceInput() > config.timeoutSecs ) {
			console.log( "#", interval_s, "s since last data; reconnecting." );
			streamClient.launch( config, termTracker );
		}
		console.log( termTracker.getCountLine( config.stringPadding ) );
		termTracker.endEpoch();
		termTracker.startEpoch();
	}

	setTimeout( Tick, config.updateIntervalSecs*1000 );
}
