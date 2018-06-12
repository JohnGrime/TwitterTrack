# 3.3 required for --no-cache option to apk
FROM alpine:3.7

# OPTIONAL - install gnuplot! Increases size of Docker image by ~20 MB
RUN apk add --no-cache gnuplot

# Install nodejs and npm
RUN apk add --no-cache nodejs nodejs-npm

# Install node modules we're using
RUN npm install --save twitter-lite


COPY twitter_track.js        ./
COPY twitter_access_keys.sh  ./
COPY twitter_test.sh         ./

CMD ["./twitter_test.sh", "London Paris Berlin Amsterdam Madrid Rome"]
