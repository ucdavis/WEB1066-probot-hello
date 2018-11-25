#!/bin/bash

set -e
docker build -t build-prometheus .

# get probot scrap url
# curl http://${LOCAL_HOST_SCRAP}:3000/probot/metrics
export LOCAL_HOST_SCRAP=$(ifconfig en0|grep 'inet\s'|awk '{print $2}')
docker run -e LOCAL_HOST_SCRAP=${LOCAL_HOST_SCRAP} -p 9090:9090 build-prometheus
