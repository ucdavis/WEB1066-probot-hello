FROM prom/prometheus

USER root
ADD curl-7.30.0.ermine.tar.bz2 .

RUN mv curl-7.30.0.ermine/curl.ermine /bin/curl \
    && rm -Rf curl-7.30.0.ermine

USER nobody
ADD prometheus.yml /etc/prometheus/
