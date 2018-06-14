# Apline is a nice lightweight Linux image.
# v3.3+ required for '--no-cache' apk option
FROM alpine:3.7

# OPTIONAL - install gnuplot! Increases size of Docker image by ~20 MB
RUN apk add --no-cache gnuplot

# Install nodejs and npm
RUN apk add --no-cache nodejs nodejs-npm

# Install node modules we're using
RUN npm install --save twitter-lite

#
# Assumes presence of following files.
# NOTE: copy in of twitter_access_keys.sh is just for
# testing! There are better approaches, see README.md
#
COPY twitter_track.js        ./
COPY twitter_access_keys.sh  ./
COPY twitter_test.sh         ./

CMD ["/bin/ash"]
