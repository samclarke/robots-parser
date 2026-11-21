var robotsParser = require('../index');
var expect = require('chai').expect;
const fs = require('fs');
const path = require('path')


function testRobots(url, contents, allowed, disallowed) {
	var robots = robotsParser(url, contents);

	allowed.forEach(function (url) {
		expect(robots.isAllowed(url), `should allow url: ${url}`).to.equal(true);
	});

	disallowed.forEach(function (url) {
		expect(robots.isDisallowed(url), `should reject url: ${url}`).to.equal(true);
	});
}

describe('Robots', function () {
	it('should parse the disallow directive', function () {
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
	});

	it('should parse the allow directive', function () {
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
			'http://www.example.com/Test.html',
			'http://www.example.com/test.html'
		];

		var disallowed = [
			'http://www.example.com/fish/index.php',
			'http://www.example.com/fish/',
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should parse patterns', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish*.php',
			'Disallow: /*.dext$',
			'Disallow: /dir*',
			'Disallow: /tester$',
			'Disallow: /a*b*c',
			'Disallow: /x*$'
		].join('\n');

		var allowed = [
			'http://www.example.com/Fish.PHP',
			'http://www.example.com/Fish.dext1',
			'http://www.example.com/folder/dir.html',
			'http://www.example.com/folder/dir/test.html',
			'http://www.example.com/testers',
			'http://www.example.com/something/tester',
			'http://www.example.com/something/ab'
		];

		var disallowed = [
			'http://www.example.com/fish.php',
			'http://www.example.com/fishheads/catfish.php?parameters',
			'http://www.example.com/AnYthInG.dext',
			'http://www.example.com/Fish.dext.dext',
			'http://www.example.com/dir/test.html',
			'http://www.example.com/directory.html',
			'http://www.example.com/tester',
			'http://www.example.com/abc',
			'http://www.example.com/axbxcx',
			'http://www.example.com/x',
			'http://www.example.com/xyz'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should parse empty patterns', function () {
		var contents = [
			'User-agent: *',
			'Disallow: ****$'
		].join('\n');

		var allowed = [];

		var disallowed = [
			'http://www.example.com/',
			'http://www.example.com/test.html'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle end patterns that start and end with same pattern', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /a$',
			'Disallow: /abc$'
		].join('\n');

		var allowed = [
			'http://www.example.com/abca',
			'http://www.example.com/abcXYZabc'
		];

		var disallowed = [
			'http://www.example.com/a',
			'http://www.example.com/abc'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle empty end patterns', function () {
		var contents = [
			'User-agent: *',
			'Disallow: $',
		].join('\n');

		var allowed = [
			'http://www.example.com/',
			'http://www.example.com/test.html'
		];

		var disallowed = [];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should not match start and end of wildcard end patterns twice', function () {
		var contents = [
			'User-agent: *',
			'Disallow: a*a$',
			'Disallow: *a*a$',
		].join('\n');

		var allowed = [
			'http://www.example.com/a',
			'http://www.example.com/ba'
		];

		var disallowed = [
			'http://www.example.com/axa',
			'http://www.example.com/xaxa'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should have the correct order precedence for allow and disallow', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish*.php',
			'Allow: /fish/index.php',
			'Disallow: /test',
			'Allow: /test/',
			'Disallow: /aa/',
			'Allow: /aa/',
			'Allow: /bb/',
			'Disallow: /bb/',
		].join('\n');

		var allowed = [
			'http://www.example.com/test/index.html',
			'http://www.example.com/fish/index.php',
			'http://www.example.com/test/',
			'http://www.example.com/aa/',
			'http://www.example.com/bb/',
			'http://www.example.com/x/'
		];

		var disallowed = [
			'http://www.example.com/fish.php',
			'http://www.example.com/fishheads/catfish.php?parameters',
			'http://www.example.com/test'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should have the correct order precedence for wildcards', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /*/',
			'Allow: /x/',
		].join('\n');

		var allowed = [
			'http://www.example.com/x/',
			'http://www.example.com/fish.php',
			'http://www.example.com/test'
		];
		
		var disallowed = [
			'http://www.example.com/a/',
			'http://www.example.com/xx/',
			'http://www.example.com/test/index.html'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should parse lines delimitated by \\r', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\r');

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
	});

	it('should parse lines delimitated by \\r\\n', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\r\n');

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
	});


	it('should parse lines delimitated by mixed line endings', function () {
		var contents = [
			'User-agent: *\r',
			'Disallow: /fish/\r\n',
			'Disallow: /test.html\n\n'
		].join('');

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
	});

	it('should ignore rules that are not in a group', function () {
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
	});


	it('should ignore comments', function () {
		var contents = [
			'#',
			'# This is a comment',
			'#',
			'User-agent: *',
			'# This is a comment',
			'Disallow: /fish/ # ignore',
			'# Disallow: fish',
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
	});

	it('should ignore invalid lines', function () {
		var contents = [
			'invalid line',
			'User-agent: *',
			'Disallow: /fish/',
			':::::another invalid line:::::',
			'Disallow: /test.html',
			'Unknown: tule'
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
	});

	it('should ignore empty user-agent lines', function () {
		var contents = [
			'User-agent:',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\n');

		var allowed = [
			'http://www.example.com/fish',
			'http://www.example.com/Test.html',
			'http://www.example.com/fish/index.php',
			'http://www.example.com/fish/',
			'http://www.example.com/test.html'
		];

		var disallowed = [];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should support groups with multiple user agents (case insensitive)', function () {
		var contents = [
			'User-agent: agenta',
			'User-agent: agentb',
			'Disallow: /fish',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.isAllowed("http://www.example.com/fish", "agenta")).to.equal(false);
	});

	it('should not fallback to * when specified but empty', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
			'User-agent: agent',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.isAllowed("http://www.example.com/fish", "agent-other")).to.equal(false);
		expect(robots.isAllowed("http://www.example.com/fish", "agent")).to.equal(true);
	});
	
	it('should return undefined for invalid urls', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var invalidUrls = [
			'http://example.com/secret.html',
			'http://ex ample.com/secret.html',
			'http://www.example.net/test/index.html',
			'http://www.examsple.com/test/',
			'example.com/test/',
			':::::;;`\\|/.example.com/test/'
		];

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		invalidUrls.forEach(function (url) {
			expect(robots.isAllowed(url)).to.equal(undefined);
		});
	});

	it('should handle Unicode, urlencoded and punycode URLs', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var allowed = [
			'http://www.münich.com/index.html',
			'http://www.xn--mnich-kva.com/index.html',
			'http://www.m%C3%BCnich.com/index.html'
		];

		var disallowed = [
			'http://www.münich.com/secret.html',
			'http://www.xn--mnich-kva.com/secret.html',
			'http://www.m%C3%BCnich.com/secret.html'
		];

		testRobots('http://www.münich.com/robots.txt', contents, allowed, disallowed);
		testRobots('http://www.xn--mnich-kva.com/robots.txt', contents, allowed, disallowed);
		testRobots('http://www.m%C3%BCnich.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle Unicode and urlencoded paths', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /%CF%80',
			'Disallow: /%e2%9d%83',
			'Disallow: /%a%a',
			'Disallow: /💩',
			'Disallow: /✼*t$',
			'Disallow: /%E2%9C%A4*t$',
			'Disallow: /✿%a',
			'Disallow: /http%3A%2F%2Fexample.org',
			'Disallow: /%E0',
			'Disallow: /%00test'
		].join('\n');

		var allowed = [
			'http://www.example.com/✼testing',
			'http://www.example.com/%E2%9C%BCtesting',
			'http://www.example.com/✤testing',
			'http://www.example.com/%E2%9C%A4testing',
			'http://www.example.com/%00allow',
		];

		var disallowed = [
			'http://www.example.com/%CF%80',
			'http://www.example.com/%CF%80/index.html',
			'http://www.example.com/π',
			'http://www.example.com/π/index.html',
			'http://www.example.com/%e2%9d%83',
			'http://www.example.com/%E2%9D%83/index.html',
			'http://www.example.com/❃',
			'http://www.example.com/❃/index.html',
			'http://www.example.com/%F0%9F%92%A9',
			'http://www.example.com/%F0%9F%92%A9/index.html',
			'http://www.example.com/💩',
			'http://www.example.com/💩/index.html',
			'http://www.example.com/%a%a',
			'http://www.example.com/%a%a/index.html',
			'http://www.example.com/✼test',
			'http://www.example.com/%E2%9C%BCtest',
			'http://www.example.com/✤test',
			'http://www.example.com/%E2%9C%A4testt',
			'http://www.example.com/✿%a',
			'http://www.example.com/%E2%9C%BF%atest',
			'http://www.example.com/http%3A%2F%2Fexample.org',
			'http://www.example.com/%E0test',
			'http://www.example.com/%00test'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle urlencoded path segments', function () {
		var contents = [
			'User-agent: *',
			'Allow: /test%2Ftest',
			'Disallow: /test/test'
		].join('\n');

		var allowed = [
			'http://www.example.com/test%2Ftest',
		];

		var disallowed = [
			'http://www.example.com/test/test'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle encoded / in paths an URLs', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /a/b',
			'Allow: /a%2Fb'
		].join('\n');

		var allowed = [
			'http://www.example.com/a%2Fb'
		];
		
		var disallowed = [
			'http://www.example.com/a/b/c',
			'http://www.example.com/a/b'
		];
		
		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle lone high / low surrogates', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /\uD800',
			'Disallow: /\uDC00'
		].join('\n');

		// These are invalid so can't be disallowed
		var allowed = [
			'http://www.example.com/\uDC00',
			'http://www.example.com/\uD800'
		];

		var disallowed = [];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should ignore host case', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /secret.html',
			'Disallow: /test',
		].join('\n');

		var allowed = [
			'http://www.example.com/index.html',
			'http://www.ExAmPlE.com/index.html',
			'http://www.EXAMPLE.com/index.html'
		];

		var disallowed = [
			'http://www.example.com/secret.html',
			'http://www.ExAmPlE.com/secret.html',
			'http://www.EXAMPLE.com/secret.html'
		];

		testRobots('http://www.eXample.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle relative paths', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
			'Allow: /fish/test',
		].join('\n');

		var robots = robotsParser('/robots.txt', contents);
		expect(robots.isAllowed('/fish/test')).to.equal(true);
		expect(robots.isAllowed('/fish')).to.equal(false);
	});

	it('should not allow relative paths if domain specified', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
			'Allow: /fish/test',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);
		expect(robots.isAllowed('/fish/test')).to.equal(undefined);
		expect(robots.isAllowed('/fish')).to.equal(undefined);
	});

	it('should not treat invalid robots.txt URLs as relative', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
			'Allow: /fish/test',
		].join('\n');

		var robots = robotsParser('https://ex ample.com/robots.txt', contents);
		expect(robots.isAllowed('/fish/test')).to.equal(undefined);
		expect(robots.isAllowed('/fish')).to.equal(undefined);
	});

	it('should not allow URls if domain specified and robots.txt is relative', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
			'Allow: /fish/test',
		].join('\n');

		var robots = robotsParser('/robots.txt', contents);
		expect(robots.isAllowed('http://www.example.com/fish/test')).to.equal(undefined);
		expect(robots.isAllowed('http://www.example.com/fish')).to.equal(undefined);
	});

	it('should allow all if empty robots.txt', function () {
		var allowed = [
			'http://www.example.com/secret.html',
			'http://www.example.com/test/index.html',
			'http://www.example.com/test/'
		];

		var robots = robotsParser('http://www.example.com/robots.txt', '');

		allowed.forEach(function (url) {
			expect(robots.isAllowed(url)).to.equal(true);
		});
	});

	it('should treat null as allowing all', function () {
		var robots = robotsParser('http://www.example.com/robots.txt', null);

		expect(robots.isAllowed("http://www.example.com/", "userAgent")).to.equal(true);
		expect(robots.isAllowed("http://www.example.com/")).to.equal(true);
	});

	it('should handle invalid robots.txt urls', function () {
		var contents = [
			'user-agent: *',
			'disallow: /',

			'host: www.example.com',
			'sitemap: /sitemap.xml'
		].join('\n');

		var sitemapUrls = [
			undefined,
			null,
			'null',
			':/wom/test/'
		];

		sitemapUrls.forEach(function (url) {
			var robots = robotsParser(url, contents);
			expect(robots.isAllowed('http://www.example.com/index.html')).to.equal(undefined);
			expect(robots.getPreferredHost()).to.equal('www.example.com');
			expect(robots.getSitemaps()).to.eql(['/sitemap.xml']);
		});
	});

	it('should parse the crawl-delay directive', function () {
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
		expect(robots.getCrawlDelay()).to.equal(undefined);
	});

	it('should ignore invalid crawl-delay directives', function () {
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
	});

	it('should parse the sitemap directive', function () {
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
	});

	it('should parse the host directive', function () {
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
	});

	it('should parse empty and invalid directives', function () {
		var contents = [
			'user-agent:',
			'user-agent:::: a::',
			'crawl-delay:',
			'crawl-delay:::: 0:',
			'host:',
			'host:: example.com',
			'sitemap:',
			'sitemap:: site:map.xml',
			'disallow:',
			'disallow::: /:',
			'allow:',
			'allow::: /:',
		].join('\n');

		robotsParser('http://www.example.com/robots.txt', contents);
	});

	it('should treat only the last host directive as valid', function () {
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
	});

	it('should return null when there is no host directive', function () {
		var contents = [
			'user-agent: a',
			'crawl-delay: 1',

			'user-agent: b',
			'disallow: /d',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getPreferredHost()).to.equal(null);
	});

	it('should fallback to * when a UA has no rules of its own', function () {
        var contents = [
			'User-agent: *',
			'Disallow: /a',

			'user-agent: b',
			'Disallow: /b',

			'user-agent: c',
			'user-agent: d',
			'Disallow: /c',
        ].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.isAllowed('http://www.example.com/a', 'should-fall-back')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/a', 'd')).to.equal(true);
		expect(robots.isAllowed('http://www.example.com/c', 'should-fall-back')).to.equal(true);
		expect(robots.isAllowed('http://www.example.com/c', 'd')).to.equal(false);
	});

	it('should have crawl-delay fallback to * when a UA has no rules of its own', function () {
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
	});

	it('should not fallback to * when a UA has rules', function () {
		var contents = [
			'user-agent: *',
			'crawl-delay: 1',

			'user-agent: b',
			'disallow:'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getCrawlDelay('b')).to.equal(undefined);
	});

	it('should handle UAs with object property names', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish',
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);
		expect(robots.isAllowed('http://www.example.com/fish', 'constructor')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/fish', '__proto__')).to.equal(false);
	});

	it('should ignore version numbers in the UA string', function () {
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
	});

	it('should ignore spaces UA string', function () {
		var contents = [
			'user-agent: *',
			'disallow:',

			'user-agent: b foo',
			'disallow: /b',

			'user-agent: c',
			'disallow: /c'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);
		
		expect(robots.isAllowed('http://www.example.com/b', 'b')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/b', 'b foo')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/b', 'b anything')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/b', 'bC')).to.equal(true);
		expect(robots.isAllowed('http://www.example.com/b', 'b-c')).to.equal(true);

		expect(robots.isAllowed('http://www.example.com/c', 'c')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/c', 'c foo')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/c', 'c anything')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/c', 'cC')).to.equal(true);
		expect(robots.isAllowed('http://www.example.com/c', 'c-c')).to.equal(true);
	});


	it('should return the line number of the matching directive', function () {
		var contents = [
			'',
			'User-agent: *',
			'',
			'Disallow: /fish/',
			'Disallow: /test.html',
			'Allow: /fish/test.html',
			'Allow: /test.html',
			'',
			'User-agent: a',
			'allow: /',
			'',
			'User-agent: b',
			'disallow: /test',
			'disallow: /t*t',
			'',
			'User-agent: c',
			'Disallow: /fish*.php',
			'Allow: /fish/index.php'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.getMatchingLineNumber('http://www.example.com/fish')).to.equal(-1);
		expect(robots.getMatchingLineNumber('http://www.example.com/fish/test.html')).to.equal(6);
		expect(robots.getMatchingLineNumber('http://www.example.com/Test.html')).to.equal(-1);

		expect(robots.getMatchingLineNumber('http://www.example.com/fish/index.php')).to.equal(4);
		expect(robots.getMatchingLineNumber('http://www.example.com/fish/')).to.equal(4);
		expect(robots.getMatchingLineNumber('http://www.example.com/test.html')).to.equal(7);

		expect(robots.getMatchingLineNumber('http://www.example.com/test.html', 'a')).to.equal(10);

		expect(robots.getMatchingLineNumber('http://www.example.com/fish.php', 'c')).to.equal(17);
		expect(robots.getMatchingLineNumber('http://www.example.com/fish/index.php', 'c')).to.equal(18);
	});

	it('should handle large wildcards efficiently', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /' + '*'.repeat(2048) + '.html',
		].join('\n');

		var allowed = [
			'http://www.example.com/' + 'sub'.repeat(2048) + 'folder/index.php',
		];

		var disallowed = [
			'http://www.example.com/secret.html'
		];

		const start = Date.now();
		testRobots('http://www.eXample.com/robots.txt', contents, allowed, disallowed);
		const end = Date.now();

		// Should take less than 500 ms (high to allow for variableness of
		// machines running the test, should normally be much less)
		expect(end - start).to.be.lessThan(500);
	});

	it('should handle a long pattern after a leading wildcard', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /*' + 'test123testing'.repeat(100)
		].join('\n');


		var allowed = [
			'http://www.example.com/' + 'test123testing'.repeat(99),
		];

		var disallowed = [
			'http://www.example.com/' + 'test123testing'.repeat(100000) + 'b',
			'http://www.example.com/b' + 'test123testing'.repeat(100000),
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should handle long repeating patterns', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /' + 'test123testing'.repeat(100) + '*' + 'test123testing'.repeat(100),
		].join('\n');


		var allowed = [
			'http://www.example.com/' + 'test123testing'.repeat(199),
		];

		var disallowed = [
			'http://www.example.com/' + 'test123testing'.repeat(100000) + 'b',
			'http://www.example.com/' + 'test123testing'.repeat(100) + 'x' + 'test123testing'.repeat(100),
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should not have N*M performance for large N or M', function () {
		const n = 100000;

		var contents = [
			'User-agent: *',
			'Disallow: /*' + 'a'.repeat(Math.floor(n / 2)) + 'b',
			'Disallow: /*b' + 'a'.repeat(Math.floor(n / 2)),
		].join('\n');


		var allowed = [
			'http://www.example.com/' + 'a'.repeat(n),
			'http://www.example.com/x' + 'a'.repeat(n),
			'http://www.example.com/' + 'x'.repeat(Math.floor(n / 2)) + 'x'+ 'a'.repeat(n/2),
		];

		var disallowed = [
			'http://www.example.com/' + 'a'.repeat(Math.floor(n / 2)) + 'b',
			'http://www.example.com/b' + 'a'.repeat(n),
		];

		const start = performance.now();
		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
		const end = performance.now();

		// Should take less than 500 ms (high to allow for variableness of
		// machines running the test, should normally be much less)
		expect(end - start).to.be.lessThan(500);
	});

	it('should not have N*M performance for large N or M with wildcards', function () {
		const n = 100000;

		var contents = [
			'User-agent: *',
			'Disallow: /' + 'a*'.repeat(Math.floor(n / 2)) + 'b',
			'Disallow: /b' + 'a*'.repeat(Math.floor(n / 2)),
		].join('\n');


		var allowed = [
			'http://www.example.com/' + 'a'.repeat(n),
		];

		var disallowed = [
			'http://www.example.com/' + 'a'.repeat(Math.floor(n / 2)) + 'b',
			'http://www.example.com/b' + 'a'.repeat(n),
		];

		const start = performance.now();
		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
		const end = performance.now();

		// Should take less than 500 ms (high to allow for variableness of
		// machines running the test, should normally be much less)
		expect(end - start).to.be.lessThan(500);
	});

	it('should find matches in long paths that the bad character shift could skip', function () {
		// Forces the Boyer-Moore path in indexOf() (part length >= 10 and
		// part length * path length >= 500000). The only run of 10 a's starts
		// right after the mismatched 'b', which the old bad character shift
		// of m skipped over.
		var contents = [
			'User-agent: *',
			'Disallow: /*aaaaaaaaaa'
		].join('\n');

		var allowed = [
			'http://www.example.com/b' + 'a'.repeat(9) + 'c'.repeat(100000)
		];

		var disallowed = [
			'http://www.example.com/b' + 'a'.repeat(10) + 'c'.repeat(100000)
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should honor given port number', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\n');

		var allowed = [
			'http://www.example.com:8080/fish',
			'http://www.example.com:8080/Test.html'
		];

		var disallowed = [
			'http://www.example.com/fish',
			'http://www.example.com/Test.html',
			'http://www.example.com:80/fish',
			'http://www.example.com:80/Test.html'
		];

		testRobots('http://www.example.com:8080/robots.txt', contents, allowed, disallowed);
	});

	it('should default to port 80 for http: if no port given', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\n');

		var allowed = [
			'http://www.example.com:80/fish',
			'http://www.example.com:80/Test.html'
		];

		var disallowed = [
			'http://www.example.com:443/fish',
			'http://www.example.com:443/Test.html',
			'http://www.example.com:80/fish/index.php',
			'http://www.example.com:80/fish/',
			'http://www.example.com:80/test.html'
		];

		testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should default to port 443 for https: if no port given', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /fish/',
			'Disallow: /test.html'
		].join('\n');

		var allowed = [
			'https://www.example.com:443/fish',
			'https://www.example.com:443/Test.html',
			'https://www.example.com/fish',
			'https://www.example.com/Test.html'
		];

		var disallowed = [
			'http://www.example.com:80/fish',
			'http://www.example.com:80/Test.html',
			'http://www.example.com:443/fish/index.php',
			'http://www.example.com:443/fish/',
			'http://www.example.com:443/test.html'
		];

		testRobots('https://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should not be disallowed when wildcard is used in explicit mode', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /',
		].join('\n')

		var url = 'https://www.example.com/hello'
		var userAgent = 'SomeBot';
		var robots = robotsParser(url, contents);

		expect(robots.isExplicitlyDisallowed(url, userAgent)).to.equal(false)
	});

	it('should be disallowed when user agent equal robots rule in explicit mode', function () {
		var contents = [
			'User-agent: SomeBot',
			'Disallow: /',
		].join('\n')

		var url = 'https://www.example.com/hello'
		var userAgent = 'SomeBot';
		var robots = robotsParser(url, contents);
		
		expect(robots.isExplicitlyDisallowed(url, userAgent)).to.equal(true)
	});

	it('should return undefined when given an invalid URL in explicit mode', function () {
		var contents = [
			'User-agent: SomeBot',
			'Disallow: /',
		].join('\n')

		var url = 'https://www.example.com/hello'
		var userAgent = 'SomeBot';
		var robots = robotsParser('http://example.com', contents);
		
		expect(robots.isExplicitlyDisallowed(url, userAgent)).to.equal(undefined)
	});

	it('should return false when no matching rule specified calling isDisallowed()', function () {
		var contents = [
			'User-agent: OtherBot',
			'Disallow: /',
		].join('\n')

		var url = 'https://example.com/hello'
		var userAgent = 'SomeBot';
		var robots = robotsParser('https://example.com', contents);
		
		expect(robots.isDisallowed(url, userAgent)).to.equal(false)
	});

	it('should ignore content beyond the 2 MiB parsing limit', function () {
        var contents = [
                'User-agent: *',
                'Disallow: /within-limit',
                '#' + 'a'.repeat(2097152),
                'Disallow: /beyond-limit'
        ].join('\n');

		var allowed = [
			'http://www.example.com/beyond-limit'
		];

		var disallowed = [
			'http://www.example.com/within-limit'
		];

        testRobots('http://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should implicitly allow robots.txt URLs', function () {
		var contents = [
			'User-agent: *',
			'Disallow: /robots.txt',
		].join('\n');

		var allowed = [
			'https://www.example.com/robots.txt',
		];
		
		// The spec says /robots.txt URI is implicitly allowed so assuming that
		// is strict and doesn't include query strings
		var disallowed = [
			'https://www.example.com/robots.txt?testing=123',
			'https://www.example.com/robots.txt/something',
			'https://www.example.com/robots.txts'
		];

		testRobots('https://www.example.com/robots.txt', contents, allowed, disallowed);
	});

	it('should start a new group after rules even if other records follow them', function () {
		['Sitemap: http://www.example.com/sitemap.xml', 'Crawl-delay: 1', 'Host: www.example.com', 'Foo: bar'].forEach(function (record) {
			var contents = [
				'User-agent: a',
				'Allow: /fish',
				record,
				'User-agent: b',
				'Disallow: /'
			].join('\n');

			var robots = robotsParser('http://www.example.com/robots.txt', contents);

			expect(robots.isAllowed('http://www.example.com/test.html', 'a'), record).to.equal(true);
			expect(robots.isAllowed('http://www.example.com/test.html', 'b'), record).to.equal(false);
		});
	});

	it('should not end a group of user-agent lines on other records', function () {
		var contents = [
			'User-agent: a',
			'Sitemap: http://www.example.com/sitemap.xml',
			'User-agent: b',
			'Disallow: /'
		].join('\n');

		var robots = robotsParser('http://www.example.com/robots.txt', contents);

		expect(robots.isAllowed('http://www.example.com/test.html', 'a')).to.equal(false);
		expect(robots.isAllowed('http://www.example.com/test.html', 'b')).to.equal(false);
	});

	it('should pass rfc9309-test-vectors.json tests', function () {
		const file = path.resolve(__dirname,'./rfc9309-test-vectors.json')
		const testVectors = JSON.parse(fs.readFileSync(file, 'utf8'));

		testVectors.vectors.forEach(vector => {
			const robots = robotsParser('http://www.example.com/robots.txt', vector.robots_txt);
			const result = robots.isAllowed('http://www.example.com' + vector.path, vector.user_agent);
			const expected = vector.expected === "allowed";

			expect(result, `should pass test id "${vector.id}"`).to.equal(expected);
		});
	});
});
