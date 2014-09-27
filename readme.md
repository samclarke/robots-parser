# Robots Parser

NodeJS robots.txt parser.

It currently supports:

  * User-agent:
  * Allow:
  * Disallow:
  * Sitemap:
  * Crawl-delay:
  * Host:
  * Paths with wildcards (*)


## Usage

	var robotsParser = require('robots-parser');

	var robots = robotsParser('http://www.example.com/robots.txt', [
		'User-agent: *',
		'Disallow: /dir/',
		'Disallow: /test.html',
		'Allow: /dir/test.html',
		'Allow: /test.html',
		'Crawl-delay: 1',
		'Sitemap: http://example.com/sitemap.xml',
		'Host: example.com'
	].join('\n'));

	robots.isAllowed('http://www.example.com/test.html', 'Sams-Bot/1.0'); // false
	robots.isAllowed('http://www.example.com/dir/test.html', 'Sams-Bot/1.0'); // true
	robots.isDisallowed('http://www.example.com/dir/test2.html', 'Sams-Bot/1.0'); // true
	robots.getCrawlDelay('Sams-Bot/1.0'); // 1
	robots.getSitemaps(); // ['http://example.com/sitemap.xml']
	robots.getPreferedHost(); // example.com


### isAllowed(url, [ua])
**boolean or undefined**

Returns true if crawling the specified URL is allowed for the specified user-agent.

This will return `undefined` if the URL isn't valid for this robots.txt.


### isDisallowed(url, [ua])
**boolean or undefined**

Returns true if crawling the specified URL is not allowed for the specified user-agent.

This will return `undefined` if the URL isn't valid for this robots.txt.


### getCrawlDelay([ua])
**number or undefined**

Returns the number of seconds the specified user-agent should wait between requests.

Returns undefined if no crawl delay has been specified for this user-agent.


### getSitemaps()
**array**

Returns an array of sitemap URLs specified by the `sitemap:` directive.


### getPreferredHost()
**string or null**

Returns the preferred host name specified by the `host:` directive or null if there isn't one.


# License

	The MIT License (MIT)

	Copyright (c) 2014 Sam Clarke

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.