/**
 * Trims the white space from the start and end of the line.
 *
 * If the line is an array it will strip the white space from
 * the start and end of each element of the array.
 *
 * @param  {string|Array} line
 * @return {string|Array}
 * @private
 */
function trimLine(line) {
	if (!line) {
		return null;
	}

	if (Array.isArray(line)) {
		return line.map(trimLine);
	}

	return String(line).trim();
}

/**
 * Remove comments from lines
 *
 * @param {string} line
 * @return {string}
 * @private
 */
function removeComments(line) {
	var commentStartIndex = line.indexOf('#');
	if (commentStartIndex > -1) {
		return line.substr(0, commentStartIndex);
	}

	return line;
}

/**
 * Splits a line at the first occurrence of :
 *
 * @param  {string} line
 * @return {Array.<string>}
 * @private
 */
function splitLine(line) {
	var idx = String(line).indexOf(':');

	if (!line || idx < 0) {
		return null;
	}

	return [line.slice(0, idx), line.slice(idx + 1)];
}

/**
 * Normalises the user-agent string by converting it to
 * lower case and removing any version numbers.
 *
 * @param  {string} userAgent
 * @return {string}
 * @private
 */
function formatUserAgent(userAgent) {
	var formattedUserAgent = userAgent.toLowerCase();
	if (formattedUserAgent[0] === '*') {
		return '*';
	}

	// 2.2.1. The User-Agent Line
	// The product token MUST contain only uppercase and lowercase letters
	// ("a-z" and "A-Z"), underscores ("_"), and hyphens ("-"). The
	var match = formattedUserAgent.match(/^[a-zA-Z_-]+/);
	return match && match[0] ? match[0] : '';
}

/**
 * Normalises the URL encoding of a path by encoding
 * unicode characters.
 *
 * @param {string} path
 * @return {string}
 * @private
 */
function normaliseEncoding(path) {
	try {
		// Encode any non-ASCII chars
		return safeDecodeURI(path).replace(/[^\x00-\x7F]/gu, (char) => {
			return encodeURIComponent(char).toUpperCase();
		});
	} catch (e) {
		return path;
	}
}

/**
 * Only decodes alpha numeric and - . _ ~ characters and converts all others to
 * uppercase.
 * @param {string} path
 */
function safeDecodeURI(path) {
	return path.replace(/%[0-9a-f]{2}/gi, (match) => {
		const code = parseInt(match.slice(1), 16);
		const isUnreserved =
			(code >= 0x41 && code <= 0x5a) || // A-Z
			(code >= 0x61 && code <= 0x7a) || // a-z
			(code >= 0x30 && code <= 0x39) || // 0-9
			code === 0x2d || // -
			code === 0x2e || // .
			code === 0x5f || // _
			code === 0x7e; // ~

		return isUnreserved ? String.fromCharCode(code) : match.toUpperCase();
	});
}

/**
 *
 * @param {string} pattern
 * @returns {Float64Array}
 */
function makeGoodSuffixTable(pattern) {
	const m = pattern.length;
	// Float64 is the same as number in JS so will allow indexing up to the spec
	// limit of a JS string length 2^(53 - 1). Most implementations cap strings
	// significantly below that limit and and no pattern should ever be that
	// long, so Uint32Array could be used but Float64Array has the same
	// performance so might as well be spec compliant.
	const suffixes = new Float64Array(m);
	const goodSuffixTable = new Float64Array(m).fill(m);

	suffixes[m - 1] = m;
	let g = m - 1;
	let f = 0;

	for (let i = m - 2; i >= 0; --i) {
		if (i > g && suffixes[i + m - 1 - f] < i - g) {
			suffixes[i] = suffixes[i + m - 1 - f];
		} else {
			if (i < g) {
				g = i;
			}

			f = i;
			while (g >= 0 && pattern[g] === pattern[g + m - 1 - f]) {
				g--;
			}
			suffixes[i] = f - g;
		}
	}

	let j = 0;
	for (let i = m - 1; i >= 0; i--) {
		if (suffixes[i] === i + 1) {
			for (; j < m - 1 - i; j++) {
				goodSuffixTable[j] = m - 1 - i;
			}
		}
	}

	for (let i = 0; i <= m - 2; i++) {
		goodSuffixTable[m - 1 - suffixes[i]] = m - 1 - i;
	}

	return goodSuffixTable;
}

/**
 * Boyer-Moore which returns on the first match. This has a worst case of O(N)
 * time and O(M) space.
 *
 * It is not O(N*M) worst case as it stops at first match. If it was finding all
 * matches, then it would be O(N+R*M) which would be O(N*M) worst case for a
 * repeating character string. The Galil rule changes that to linear matching
 * when finding all matches but as this is only getting first match it is O(N).
 *
 * @param {string} needle
 * @param {string} haystack
 * @param {number} startIndex
 * @returns {number}
 */
function boyerMoore(needle, haystack, startIndex) {
	const n = haystack.length;
	const m = needle.length;

	if (n < m || startIndex < 0 || startIndex > n - m) {
		return -1;
	}

	const badCharacterTable = new Map();
	for (let i = 0; i < m - 1; i++) {
		badCharacterTable.set(needle[i], m - 1 - i);
	}

	const goodSuffixTable = makeGoodSuffixTable(needle);

	let j = startIndex;
	while (j <= n - m) {
		let i = m - 1;

		while (i >= 0 && needle[i] === haystack[j + i]) {
			i--;
		}

		if (i < 0) {
			return j;
		}

		const matchedLength = m - 1 - i;
		const badCharacterShift = badCharacterTable.has(haystack[j + i])
			? badCharacterTable.get(haystack[j + i]) - matchedLength
			: m - matchedLength;
		const goodSuffixShift = goodSuffixTable[i];

		j += Math.max(goodSuffixShift, badCharacterShift, 1);
	}

	return -1;
}

/**
 * @param {string} needle
 * @param {string} haystack
 * @param {Number} index
 * @returns {Number}
 */
function indexOf(needle, haystack, index) {
	if (needle === '') {
		return index;
	}

	const n = haystack.length - index;

	// For small M, native indexOf() even if O(N*M) is faster
	// The worst case N*M when N = 1000 is also faster so anything less is fine
	// As the worst case of N = 1000 is 500000 (M=500, N=1000) anything taking
	// less than that should also fine. This covers most paths and patterns.
	if (needle.length < 10 || n < 1000 || needle.length * n < 500000) {
		return haystack.indexOf(needle, index);
	}

	return boyerMoore(needle, haystack, index);
}

/**
 * This algorithm is O(N + ∑ indexOf(part)) making the worst case for this the
 * same as indexOf().
 *
 * V8: For large N uses Boyer-Moore-Horspool which falls back to Boyer-Moore for
 * bad inputs. The Boyer-Moore implementation has a limit on table sizes so it
 * could be O(N*M) but previous strategies look like they match, at least some,
 * inputs that would cause O(N*M). It's worst case appears to be O(N) although
 * there maybe some inputs that can get though and cause O(N*M) behaviour.
 * https://sourcegraph.com/r/github.com/v8/v8/-/blob/src/strings/string-search.h?L297
 * JSC: Same as V8
 * https://github.com/WebKit/WebKit/blob/main/Source/WTF/wtf/text/AdaptiveStringSearcher.h
 * SpiderMonkey: For large N uses SIMD with O(N*M) worst case
 * https://searchfox.org/firefox-main/source/js/src/builtin/String.cpp#2179
 *
 * Base on the above, this will have a worst case of either O(N) or O(N*M) in
 * V8 and JSC, and  O(N*M) on SpiderMonkey.
 *
 * Because of this, it makes sense to use an O(N) algorithm although due to the
 * amount of setup, and the fact it isn't written in native code, the JS
 * implementation of Boyer-Moore is slower for small N so we fall back to the
 * native indexOf for them.
 *
 * BoyersMoore with N=2,000,000 (with 2,000,000 robots.txt limit) is ~24ms which
 * seems like a safe limit as neither Chrome nor Safari can process anything
 * larger and the defaults for most servers are significantly lower:
 *
 * - Chrome displays up to ~32,000 chars and supports up to 2MB
 * - Safari ~80,000 chars
 * - Firefox displays up to ~64,000 chars but supports longer
 * - Cloudflare 16kb
 * - Nginx 4kb (can be configured larger)
 * - Apache 8kb (can be configured larger)
 * - IIS 16kb (can be configured larger)
 *
 * How this works:
 *
 * This splits a pattern at wildcards, it finds the first match for each part of
 * the pattern. It then skips to find the first match for the next part and so
 * on, if it reaches the end then it matches, if not, it doesn't.
 *
 * This never needs to backtrack as always does minimum required and any string
 * that doesn't match the minimum will not match.
 *
 * If has an end anchor, it checks the last part matches the end. This is
 * correct as there will be a * between he last part and the remainder which
 * means anything between will match.
 *
 * @param {string} pattern
 * @param {string} path
 * @returns {boolean}
 * @private
 */
function matches(pattern, path) {
	const hasEndAnchor = pattern.endsWith('$');

	// Remove duplicate wildcards and end anchor and split into parts
	const parts = pattern.replace(/\*+/g, '*').replace(/\$$/, '').split('*');

	// End anchor with no wildcards means must be 100% equal
	if (hasEndAnchor && parts.length === 1) {
		return path === parts[0];
	}

	// Must always start with first part. If pattern is *test the parts will be
	// ['', 'test'] and '' will always match which is correct for *
	if (!path.startsWith(parts[0])) {
		return false;
	}

	// Make sure end part (if there is any parts) matches.
	// Can't exit early if only two parts as a*a$ would match "a" so need to
	// continue to full matching loop if this matches
	if (hasEndAnchor && !path.endsWith(parts[parts.length - 1])) {
		return false;
	}

	let pathIndex = parts[0].length;
	// This isn't N*N as it starts at pathIndex index and never backtracks, so
	// the worst case is indexOf(part) + indexOf(part) + ...
	// making it the same worst case as indexOf()
	for (let i = 1; i < parts.length; i++) {
		const index = indexOf(parts[i], path, pathIndex);
		if (index < 0) {
			return false;
		}

		pathIndex = index + parts[i].length;
	}

	return true;
}

function parseRobots(contents, robots) {
	var newlineRegex = /\r\n|\r|\n/;
	var lines = contents
		// Limit to ~2 mb (could be larger due to unicode but this deals with
		// chars makes no difference for this case) which is 4x larger than
		// Google's limit of 500 kb and the minimum required by the spec
		.substring(0, 2097152)
		.split(newlineRegex)
		.map(removeComments)
		.map(splitLine)
		.map(trimLine);

	var currentUserAgents = [];
	/**
	 * Used to allow crawl-delay and any other non-standard directives to have
	 * their own grouping without affecting the RFC standard groupings.
	 */
	var currentNoneStandardUserAgents = [];
	var isGroupTermination = true;
	var isNoneStandardGroupTermination = true;
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		if (!line || !line[0]) {
			continue;
		}

		const rule = line[0].toLowerCase();
		switch (rule) {
			case 'user-agent':
				if (isGroupTermination) {
					currentUserAgents.length = 0;
				}

				if (isNoneStandardGroupTermination) {
					currentNoneStandardUserAgents.length = 0;
				}

				if (line[1]) {
					const userAgent = formatUserAgent(line[1]);
					currentUserAgents.push(userAgent);
					currentNoneStandardUserAgents.push(userAgent);

					robots._rules[userAgent] = robots._rules[userAgent] || [];
				}
				break;
			case 'disallow':
				robots.addRule(currentUserAgents, line[1], false, i + 1);
				break;
			case 'allow':
				robots.addRule(currentUserAgents, line[1], true, i + 1);
				break;
			case 'crawl-delay':
				robots.setCrawlDelay(currentNoneStandardUserAgents, line[1]);
				break;
			case 'sitemap':
				if (line[1]) {
					robots.addSitemap(line[1]);
				}
				break;
			case 'host':
				if (line[1]) {
					robots.setPreferredHost(line[1].toLowerCase());
				}
				break;
		}

		// Other records (sitemap, crawl-delay, host, unknown) must not change
		// the grouping: only a rule ends the user-agent lines of a group
		if (rule === 'user-agent') {
			isGroupTermination = false;
		} else if (rule === 'allow' || rule === 'disallow') {
			isGroupTermination = true;
		}
		isNoneStandardGroupTermination = rule !== 'user-agent';
	}
}

/**
 * Returns if a pattern is allowed by the specified rules.
 *
 * @param  {string}  path
 * @param  {Array.<Object>}  rules
 * @return {Object?}
 * @private
 */
function findRule(path, rules) {
	var matchedRule = null;

	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];

		if (!matches(rule.pattern, path)) {
			continue;
		}

		// The longest matching rule takes precedence
		// If rules are the same length then allow takes precedence
		if (!matchedRule || rule.pattern.length > matchedRule.pattern.length) {
			matchedRule = rule;
		} else if (
			rule.pattern.length == matchedRule.pattern.length &&
			rule.allow &&
			!matchedRule.allow
		) {
			matchedRule = rule;
		}
	}

	return matchedRule;
}

/**
 * Converts provided string into an URL object.
 *
 * Will return null if provided string is not a valid URL.
 *
 * @param {string} url
 * @return {?URL}
 * @private
 */
function parseUrl(url) {
	try {
		// Specify a URL to be used with relative paths
		// Using non-existent subdomain so can never cause conflict unless
		// trying to crawl it but doesn't exist and even if tried worst that can
		// happen is it allows relative URLs on it.
		var url = new URL(url, 'http://robots-relative.samclarke.com/');

		if (!url.port) {
			url.port = url.protocol === 'https:' ? 443 : 80;
		}

		return url;
	} catch (e) {
		return null;
	}
}

/**
 * @param {string} url
 * @param {string} contents
 */
function Robots(url, contents) {
	this._url = parseUrl(url) || {};
	this._rules = Object.create(null);
	this._sitemaps = [];
	this._preferredHost = null;

	parseRobots(contents || '', this);
}

/**
 * Adds the specified allow/deny rule to the rules
 * for the specified user-agents.
 *
 * @param {Array.<string>} userAgents
 * @param {string} pattern
 * @param {boolean} allow
 * @param {number} [lineNumber] Should use 1-based indexing
 */
Robots.prototype.addRule = function (userAgents, pattern, allow, lineNumber) {
	var rules = this._rules;

	userAgents.forEach(function (userAgent) {
		if (!pattern) {
			return;
		}

		rules[userAgent].push({
			pattern: normaliseEncoding(pattern),
			allow: allow,
			lineNumber: lineNumber
		});
	});
};

/**
 * Adds the specified delay to the specified user agents.
 *
 * @param {Array.<string>} userAgents
 * @param {string} delayStr
 */
Robots.prototype.setCrawlDelay = function (userAgents, delayStr) {
	var rules = this._rules;
	var delay = Number(delayStr);

	userAgents.forEach(function (userAgent) {
		if (isNaN(delay)) {
			return;
		}

		rules[userAgent].crawlDelay = delay;
	});
};

/**
 * Add a sitemap
 *
 * @param {string} url
 */
Robots.prototype.addSitemap = function (url) {
	this._sitemaps.push(url);
};

/**
 * Sets the preferred host name
 *
 * @param {string} url
 */
Robots.prototype.setPreferredHost = function (url) {
	this._preferredHost = url;
};

Robots.prototype._getRule = function (url, ua, explicit) {
	var parsedUrl = parseUrl(url) || {};
	var userAgent = formatUserAgent(ua || '*');

	// The base URL must match otherwise this robots.txt is not valid for it.
	if (
		parsedUrl.protocol !== this._url.protocol ||
		parsedUrl.hostname !== this._url.hostname ||
		parsedUrl.port !== this._url.port
	) {
		return;
	}

	var rules = this._rules[userAgent];
	if (!explicit) {
		rules = rules || this._rules['*'];
	}
	rules = rules || [];

	var path = normaliseEncoding(parsedUrl.pathname + parsedUrl.search);
	// The /robots.txt URI is implicitly allowed
	if (path === '/robots.txt') {
		return null;
	}

	return findRule(path, rules);
};

/**
 * Returns true if allowed, false if not allowed.
 *
 * Will return undefined if the URL is not valid for
 * this robots.txt file.
 *
 * @param  {string}  url
 * @param  {string?}  ua
 * @return {boolean?}
 */
Robots.prototype.isAllowed = function (url, ua) {
	var rule = this._getRule(url, ua, false);

	if (typeof rule === 'undefined') {
		return;
	}

	return !rule || rule.allow;
};

/**
 * Returns the line number of the matching directive for the specified
 * URL and user-agent if any.
 *
 * The line numbers start at 1 and go up (1-based indexing).
 *
 * Return -1 if there is no matching directive. If a rule is manually
 * added without a lineNumber then this will return undefined for that
 * rule.
 *
 * @param  {string}  url
 * @param  {string?}  ua
 * @return {number?}
 */
Robots.prototype.getMatchingLineNumber = function (url, ua) {
	var rule = this._getRule(url, ua, false);

	return rule ? rule.lineNumber : -1;
};

/**
 * Returns the opposite of isAllowed()
 *
 * @param  {string}  url
 * @param  {string?}  ua
 * @return {boolean}
 */
Robots.prototype.isDisallowed = function (url, ua) {
	return !this.isAllowed(url, ua);
};

/**
 * Returns trues if explicitly disallowed
 * for the specified user agent (User Agent wildcards are discarded).
 *
 * This will return undefined if the URL is not valid for this robots.txt file.
 *
 * @param  {string}  url
 * @param  {string}  ua
 * @return {boolean?}
 */
Robots.prototype.isExplicitlyDisallowed = function (url, ua) {
	var rule = this._getRule(url, ua, true);
	if (typeof rule === 'undefined') {
		return;
	}

	return !(!rule || rule.allow);
};

/**
 * Gets the crawl delay if there is one.
 *
 * Will return undefined if there is no crawl delay set.
 *
 * @param  {string} ua
 * @return {number?}
 */
Robots.prototype.getCrawlDelay = function (ua) {
	var userAgent = formatUserAgent(ua || '*');

	return (this._rules[userAgent] || this._rules['*'] || {}).crawlDelay;
};

/**
 * Returns the preferred host if there is one.
 *
 * @return {string?}
 */
Robots.prototype.getPreferredHost = function () {
	return this._preferredHost;
};

/**
 * Returns an array of sitemap URLs if there are any.
 *
 * @return {Array.<string>}
 */
Robots.prototype.getSitemaps = function () {
	return this._sitemaps.slice(0);
};

module.exports = Robots;
