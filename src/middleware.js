var fs = require('fs');
var chokidar = require('chokidar');
var http = require('http');
var observeMetricsFileContent = require('./metrics');
const port = process.env.METRICS_PORT || 3000;

var watchPath = process.env.METRICS_WATCH_PATH || '/var/lib/td-agent/fluentd-http-exporter/buffer';

var promCli = require('prom-client');

var Registry = promCli.Registry;
var register = new Registry();

var histogram = new promCli.Histogram({
  name: 'http_request_duration_milliseconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status', 'instance'],
  registers: [register]
});

var watcher = chokidar.watch(watchPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

function processFile(filename) {
  fs.readFile(filename, 'utf8', function (err, data) {
    observeMetricsFileContent(histogram, data);
    fs.unlinkSync(filename);
  });
}

watcher.on('add', processFile);

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(register.metrics());
  res.end();
}).listen(port);
