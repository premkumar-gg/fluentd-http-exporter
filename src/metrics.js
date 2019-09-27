function getNormalisedPath(aPath) {
  if (aPath.startsWith("/")) {
    aPath = aPath.split('/')[1];
  } else {
    aPath = aPath.split('/')[0];
  }

  aPath = aPath.split('?')[0];

  return '/' + aPath;
}

function shouldObserve(aPath) {
  aPath = aPath.toLowerCase();
  var blacklistExtensions = [
    "jpg", "png", "jpeg", "js", "css", "otf", "fnt", "ttf", "svg", "gif", "woff", "webp"
  ];

  for (var i = 0; i <= blacklistExtensions.length; i++) {
    if (aPath.includes(blacklistExtensions[i])) {
      return false;
    }
  }

  return getNormalisedPath(aPath).length <= 200;
}

function observeMetricsItem(aJsonObjectString, histogram) {
  var aJsonObject = JSON.parse(aJsonObjectString);

  if (!shouldObserve(aJsonObject.path)) {
    return;
  }

  histogram.observe({
    method: aJsonObject.method,
    path: getNormalisedPath(aJsonObject.path),
    status: aJsonObject.code,
    instance: process.env.METRICS_SERVER_INSTANCE
  }, Math.floor(aJsonObject.latency_microseconds / 1000));
}

function observeMetricsFileContent(histogram, metricsFileContent) {
  var jsonObjectsArray = metricsFileContent.split('\n');

  jsonObjectsArray.forEach(function (aJsonObjectString) {
    if (aJsonObjectString.trim().length !== 0) {

      try {
        observeMetricsItem(aJsonObjectString, histogram);
      } catch (e) {
        console.log('A NEW fatal error occurred parsing a JSON object: ' + aJsonObjectString);
      }
    }
  });
}

module.exports = observeMetricsFileContent;
