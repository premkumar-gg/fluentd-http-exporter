# Http log Prometheus exporter

## Problem addressed

Apache mod_status based Prometheus exporter does not provide the stats about the 
http calls, so there is no easy way to measure the volume, availability, and 
latency of the Apache requests. This is especially tough when the Apache server
is on a non-containarized legacy server, as part of a monolith.

## Solutions

* DID NOT WORK. Used a random apache access log exporter. Proved to be unworthy pursuit
as it wanted a few libraries affecting the kernel. This is especially risky 
on a legacy monolith
* DID NOT WORK. Tried to use [goreplay](https://goreplay.org/). This misses packets, and matching
request and response was a nightmare, even with the official nodejs libraries.
* WORKED. **This solution**, which uses Fluentd to
[convert apache access logs to json](./conf/td-agent/td-agent.conf), then 
passing it on to the [middleware](./src/middleware.js). The middleware then 
digests the request/response and exposes metrics in
[http://localhost:3000/metrics](http://localhost:3000/metrics)

## Pre-requisites
* npm version 8.x or above
* pm2 installed globally (optional, recommended)
* Access logs in certain format as [seen here](./conf/httpd/httpd.conf)
* td-agent installed [https://docs.fluentd.org/installation/install-by-rpm](https://docs.fluentd.org/installation/install-by-rpm)
* td-agent conf [here](./conf/td-agent/td-agent.conf)

## How to run
Once all the required software are installed and configured:
1. Get this repository into the directory where td-agent is installed. Typically `/var/lib/td-agent` (Top tip: Use Ansible or a CD pipeline ;) )
2. Run `pm2 start ecosystem.config.js`

## Post-checks and troubleshooting
1. Make sure the directory `/var/lib/td-agent/fluentd-http-exporter/buffer` is empty. If it is not, check `pm2 logs fluentd-http-exporter`
to find where the process is failing.
2. Curl http://localhost:3000/metrics to find if the metrics are exposed. If not, check the pm2 logs to find why.

## Metrics
* `http_request_duration_milliseconds_count` a counter with labels for path, method, status, and instance counting the number of times a
certain combination of the labels observed
* `http_request_duration_milliseconds_sum` a counter with labels for path, method, status, and instance counting the time taken to respond to a
certain combination of the labels observed
* `http_request_duration_milliseconds_bucket` a gauge with labels for path, method, status, and instance measuring the time taken to respond
to a certain combination of the labels observed

## Shortcomings of this solution
On a high-traffic server with 100s of different paths, the metrics exposed 
can easily be overwhelming for a Prometheus server to scrape. This demands a
chunky Prometheus server. Use it in production with care. It does not affect 
the Apache server, but only the Prometheus server.

## TODO
1. Currently all the requests are traced as histogram for latency. This produces
over-rich amount of metrics, which may not be necessary ideally. To reduce stress
on the Prometheus server, it will be great to only **count** all the paths, and
measure **latency** only on whitelisted paths.


Contributions welcome!
