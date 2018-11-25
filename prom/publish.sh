#!/bin/bash

set -e

docker build -t leopoppy-prometheus .

heroku container:login
heroku container:push leopoppy-prometheus

heroku container:release leopoppy-prometheus
