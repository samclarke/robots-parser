var robotsParser = require('../index');
var expect = require('chai').expect;
var punycode = require('punycode');


function testRobots(url, contents, allowed, disallowed) {
	var robots = robotsParser(url, contents);

	allowed.forEach(function (url) {
		expect(robots.isAllowed(url)).to.equal(true);
	});

	disallowed.forEach(function (url) {
		expect(robots.isAllowed(url)).to.equal(false);
	});
}

describe('Robots', function () {
	it('should parse the disallow directive', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\n');

		var allowed = [
			'http://www.example.com/fish',
			'http://www.example.com/Test.html'
		];

		var disallowed = [
			'http://www.example.com/fish/index.php',
			'http://www.example.com/fish/',
			'http://www.example.com/test.html'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);

		done();
	});

	it('should parse the allow directive', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html',
			'Allow: /fish/test.html',
			'Allow: /test.html'
		].join('\n');

		var allowed = [
			'http://www.example.com/fish',
			'http://www.example.com/fish/test.html',
			'http://www.example.com/Test.html'
		];

		var disallowed = [
			'http://www.example.com/fish/index.php',
			'http://www.example.com/fish/',
			'http://www.example.com/test.html'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);

		done();
	});

	it('should parse patterns', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /fish*.php',
			'Disallow: /*.dext$'
		].join('\n');

		var allowed = [
			'http://www.example.com/Fish.PHP',
			'http://www.example.com/Fish.dext1'
		];

		var disallowed = [
			'http://www.example.com/fish.php',
			'http://www.example.com/fishheads/catfish.php?parameters',
			'http://www.example.com/AnYthInG.dext',
			'http://www.example.com/Fish.dext.dext'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);

		done();
	});

	it('should have the correct order presidence for allow and disallow', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /fish*.php',
			'Allow: /fish/index.php',
			'Disallow: /test',
			'Allow: /test/',
		].join('\n');

		var allowed = [
			'http://www.example.com/test/index.html',
			'http://www.example.com/test/'
		];

		var disallowed = [
			'http://www.example.com/fish.php',
			'http://www.example.com/fishheads/catfish.php?parameters',
			'http://www.example.com/fish/index.php',
			'http://www.example.com/test'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);

		done();
	});

	it('should ignore rules that are not in a group', function (done) {
		var contents = [
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var allowed = [
			'http://www.example.com/secret.html',
			'http://www.example.com/test/index.html',
			'http://www.example.com/test/'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, []);

		done();
	});

	it('should return undefined for invalid urls', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var invalidUrls = [
			'http://example.com/secret.html',
			'http://www.example.net/test/index.html',
			'http://www.examsple.com/test/'
		];

		var robots = robotsParser('http://www.example.com/robots.txt', '');

		invalidUrls.forEach(function (url) {
			expect(robots.isAllowed(url)).to.equal(undefined);
		});

		done();
	});

	it('should handle Unicode and punycode URLs', function (done) {
		var contents = [
			'User-agent: *',
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var allowed = [
			'http://www.münich.com/index.html',
			'http://www.xn--mnich-kva.com/index.html'
		];

		var disallowed = [
			'http://www.münich.com/secret.html',
			'http://www.xn--mnich-kva.com/secret.html'
		];

		testRobots('http://www.münich.com/robots.txt', contents, allowed, disallowed);

		done();
	});

	it('should allow all if empty robots.txt', function (done) {
		var allowed = [
			'http://www.example.com/secret.html',
			'http://www.example.com/test/index.html',
			'http://www.example.com/test/'
		];

		var robots = robotsParser('http://www.example.com/robots.txt', '');

		allowed.forEach(function (url) {
			expect(robots.isAllowed(url)).to.equal(true);
		});

		done();
	});

	it('should parse the crawl-delay directive', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',

			'user-agent: b',
			'disallow: /d',

			'user-agent: c',
			'user-agent: d',
			'crawl-delay: 10'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('a')).to.equal(1);
		expect(robots.getCrawlDelay('b')).to.equal(undefined);
		expect(robots.getCrawlDelay('c')).to.equal(10);
		expect(robots.getCrawlDelay('d')).to.equal(10);

		done();
	});

	it('should ignore invalid crawl-delay directives', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1.2.1',

			'user-agent: b',
			'crawl-delay: 1.a0',

			'user-agent: c',
			'user-agent: d',
			'crawl-delay: 10a'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('a')).to.equal(undefined);
		expect(robots.getCrawlDelay('b')).to.equal(undefined);
		expect(robots.getCrawlDelay('c')).to.equal(undefined);
		expect(robots.getCrawlDelay('d')).to.equal(undefined);

		done();
	});

	it('should parse the sitemap directive', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',
			'sitemap: http://example.com/test.xml',

			'user-agent: b',
			'disallow: /d',

			'sitemap: /sitemap.xml',
			'sitemap:     http://example.com/test/sitemap.xml     '
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getSitemaps()).to.eql([
			'http://example.com/test.xml',
			'/sitemap.xml',
			'http://example.com/test/sitemap.xml'
		]);

		done();
	});

	it('should parse the host directive', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',
			'host: www.example.net',

			'user-agent: b',
			'disallow: /d',

			'host: example.com'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getPreferredHost()).to.equal('example.com');

		done();
	});

	it('should treat only the last host directive as valid', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',
			'host: www.example.net',

			'user-agent: b',
			'disallow: /d',

			'host: example.net',
			'host: example.com'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getPreferredHost()).to.equal('example.com');

		done();
	});

	it('should return null when there is no host directive', function (done) {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',

			'user-agent: b',
			'disallow: /d',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getPreferredHost()).to.equal(null);

		done();
	});

	it('should fallback to * when a UA has no rules of its own', function (done) {
		var contents = [
			'user-agent: *',
			'crawl-delay: 1',

			'user-agent: b',
			'crawl-delay: 12',

			'user-agent: c',
			'user-agent: d',
			'crawl-delay: 10'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('should-fall-back')).to.equal(1);
		expect(robots.getCrawlDelay('d')).to.equal(10);
		expect(robots.getCrawlDelay('dd')).to.equal(1);

		done();
	});

	it('should not fallback to * when a UA has rules', function (done) {
		var contents = [
			'user-agent: *',
			'crawl-delay: 1',

			'user-agent: b',
			'disallow:'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('b')).to.equal(undefined);

		done();
	});

	it('should ignore version numbers in the UA string', function (done) {
		var contents = [
			'user-agent: *',
			'crawl-delay: 1',

			'user-agent: b',
			'crawl-delay: 12',

			'user-agent: c',
			'user-agent: d',
			'crawl-delay: 10'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('should-fall-back/1.0.0')).to.equal(1);
		expect(robots.getCrawlDelay('d/12')).to.equal(10);
		expect(robots.getCrawlDelay('dd / 0-32-3')).to.equal(1);
		expect(robots.getCrawlDelay('b / 1.0')).to.equal(12);

		done();
	});
});