var assert = require('assert');
var sinon = require('sinon');
var observeMetricsFileContent = require('../src/metrics');

describe('metrics', function() {
  describe('observeMetrics', function() {
    it('should not observe blacklisted extensions', function() {
      var histogram = { observe: sinon.fake() };

      var blacklistExtensions = [
        "jpg", "png", "jpeg", "js", "css", "otf", "fnt", "ttf", "svg", "gif", "woff", "webp"
      ];

      for (var i = 0; i <= blacklistExtensions.length; i++) {
        observeMetricsFileContent(histogram, JSON.stringify({
          method: 'GET',
          path: '/test.' + blacklistExtensions[i],
          code: '200',
          latency_microseconds: 20000
        }));
        assert(!histogram.observe.called);
      }
    });

    it('should observe paths other than blacklisted extensions', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, JSON.stringify({ method: 'GET', path: '/orders', code: '200', latency_microseconds: 20000 }));

      assert(histogram.observe.called);
    });

    it('should observe only the first part of the path', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, JSON.stringify({ method: 'GET', path: '/orders/1234/view', code: '200', latency_microseconds: 20000 }));

      sinon.assert.calledWith(histogram.observe, {
        method: 'GET',
        path: '/orders',
        status: '200',
        instance: sinon.match.any
      });
    });

    it('should observe the path without search queries', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, JSON.stringify({ method: 'GET', path: '/orders?sth=1736', code: '200', latency_microseconds: 20000 }));

      sinon.assert.calledWith(histogram.observe, {
        method: 'GET',
        path: '/orders',
        status: '200',
        instance: sinon.match.any
      });
    });

    it('should observe latency in milliseconds rounded down', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, JSON.stringify({ method: 'GET', path: '/test', code: '200', latency_microseconds: 20999 }));

      sinon.assert.calledWith(histogram.observe, {
        method: 'GET',
        path: '/test',
        status: '200',
        instance: sinon.match.any
      }, 20);
    });

    it('should not observe longer paths', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, JSON.stringify({ method: 'GET', path: '/asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-' +
          'asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf-' +
          'asdfrtfdrtsfrdrfysdf-asdfrtfdrtsfrdrfysdf', code: '200', latency_microseconds: 20000 }));

      assert(!histogram.observe.called);
    });

    it('should not FATALLY crash when an invalid JSON is passed', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram, "{ 'method': 'GET', 'path': '/test', 'code': '200'");
      assert(true);

      observeMetricsFileContent(histogram, "  ");
      assert(true);
    });

    it('should process multiple lines ignoring failed JSONs and blacklisted extensions', function() {
      var histogram = { observe: sinon.fake() };

      observeMetricsFileContent(histogram,
        JSON.stringify({ method: 'GET', path: '/orders', code: '200', latency_microseconds: 20000 })
        + '\n' + JSON.stringify({ method: 'GET', path: '/orders/123', code: '200', latency_microseconds: 20000 })
        + '\n' + JSON.stringify({ method: 'GET', path: '/activate', code: '200', latency_microseconds: 20000 })
        + '\n' + JSON.stringify({ method: 'GET', path: '/test.png', code: '200', latency_microseconds: 20000 })
        + '\n' + JSON.stringify({ method: 'GET', path: '/test.png', code: '200', latency_microseconds: 20000 }).replace('}', '')
        + '\n' + JSON.stringify({ method: 'GET', path: '/test', code: '200', latency_microseconds: 20000 })
      );

      sinon.assert.callCount(histogram.observe, 4);
    });
  });
});
