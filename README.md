# TwitterTrack

A simple example interface into Twitter's stream API.

Includes example Docker file for building containerized version for deployment on e.g. Amazon Web Services.

## Requirements

Mandatory:

* [Node.js](https://nodejs.org/)
* [twitter-lite](https://www.npmjs.com/package/twitter-lite) node package
* [Twitter developer access tokens](https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html), accessible as environment variables

Optional:

* [Bash](https://en.wikipedia.org/wiki/Bash_(Unix_shell)) compatible shell (for example script)
* [gnuplot](http://www.gnuplot.info) (for easy plotting of example output data)

## Platform compatibility

In principle, anything that supports Node.js!

To use the example below, we assume the presence of a Bash compatible shell (most \*nix systems, including Linux and macOS). To produce the graphical output shown, gnuplot is required.

## Example usage

The `twitter_test.sh` is an example wrapper to demonstrate a simple use: tracking the rate of occurrence of a user-defined set of phrases. This script assumes the presence of a `twitter_access_keys.sh` file in the same directory, which exports the appropriate [Twitter access keys](https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html) into the current shell environment, e.g.:

	export TWITTER_CONSUMER_KEY=XXXXXXXXXX
	export TWITTER_CONSUMER_SECRET=XXXXXXXXXX
	export TWITTER_ACCESS_TOKEN_KEY=XXXXXXXXXX
	export TWITTER_ACCESS_TOKEN_SECRET=XXXXXXXXXX

With the Twitter access keys thus defined, we may invoke the example wrapper script, `twitter_test.sh`.

Let's sample real-time mentions of the world's great metropolises:

	./twitter_test.sh London "New York" Paris "St. Helens"
	    Time:D/M/Y:GMT          interval/s              missed            "London"          "New York"             "Paris"        "St. Helens"
	11/5/2018 23:29:10                1.71                   0                   4                   5                   3                   0
	11/5/2018 23:29:12               2.004                   0                   1                   1                   4                   0
	11/5/2018 23:29:14               2.001                   0                   3                   5                   5                   0
	11/5/2018 23:29:16               2.001                   0                   1                  11                   1                   0
	11/5/2018 23:29:18                   2                   0                   1                   8                   3                   0
	11/5/2018 23:29:20               2.003                   0                   2                   4                   7                   0
	11/5/2018 23:29:22               2.005                   0                   1                   2                   5                   0
	11/5/2018 23:29:24               2.007                   0                   3                   6                   4                   0
	11/5/2018 23:29:26                   2                   0                   7                   6                  10                   0
	11/5/2018 23:29:28               2.001                   0                   3                   1                   1                   0

One would naturally expect St. Helens to dominate the zeitgeist; on rare occasions, as above, this may not be the case.

Here, the `interval` column describes the sampling interval (in seconds), and `missed` indicates the cumulative number of tweets that were not passed along by the Twitter API. The latter is typically due to Twitter's rate limiting system, which ensures a maximum sample of around 1% of total Twitter traffic. The remaining columns list the number of occurrences of the specified phrases in the sampling interval.

If you have `gnuplot` installed, the outout of `twitter_test.sh` can be turned into a graph like so ...

	gnuplot plot_output.gscr

... which produces an encapsulated PostScript file:

![St. Helens, greatest of all the world's cities](test.png)

## Docker

Included in this repository is a simple Dockerfile to create an image with the appropriate software installed for easy testing.

Build the image with a suitable name (e.g. `john/twittertrack`):

	docker build -t john/twittertrack .

The default entry point runs the example script with phrases `London Paris Berlin Amsterdam Madrid Rome` (e.g., assuming itneractive shell and not saving local file system changes):

	docker run --rm -it --name jtwitter john/twitter /bin/ash
	./twitter_test.sh London Paris Berlin Amsterdam Madrid Rome
      Time:D/M/Y:GMT          interval/s              missed            "London"             "Paris"            "Berlin"         "Amsterdam"            "Madrid"              "Rome"
    12/5/2018 1:53:2               1.698                   0                   1                   1                   1                   0                   2                   0
    12/5/2018 1:53:4               2.001                   0                   3                   0                   0                   1                   1                   0
    12/5/2018 1:53:6               2.002                   0                   3                   3                   0                   0                   2                   1
    12/5/2018 1:53:8                   2                   0                   6                   4                   0                   0                   1                   2
   12/5/2018 1:53:10               2.003                   0                   0                   3                   3                   0                   0                   0
   12/5/2018 1:53:12               2.003                   0                   2                   5                   0                   0                   2                   0
   12/5/2018 1:53:14               2.001                   0                   5                   3                   0                   1                   2                   0

## Notes

* Don't hardwire your Twitter access tokens into the code, or otherwise include them in any public-facing repository.
* Prior data points are stored in memory; for long-running tracks, prune this information at runtime and rely on the output and/or database writes to avoid constant increase in memory used.

Happy tracking!
