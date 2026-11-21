# Changelog

## Version 3.1.1

-   Fixed bug from 3.1.0 with sitemap, crawl-delay, host and unknown directives not terminating groups.
    &ndash; Thanks to @bardrop for reporting and fixing.

## Version 3.1.0

-   Updated README to point to RFC 9309 instead of the draft specification.
    &ndash; Thanks to @joepie91 for reporting.
-   Fixed CommonJS export type in typescript definitions.
    &ndash; Thanks to @markedwards for fixing.
-   Added `isExplicitlyDisallowed()` method.
    &ndash; Thanks to @AuDigent for implementing.
-   Fixed grouping to match RFC 9309 by not treating non-standard directives like crawl-delay as terminating a group.
    &ndash; Thanks to @bensynapse for reporting.
-   Fixed URL encoded path handling to match RFC 9309.
    &ndash; Thanks to @bensynapse for reporting.
-   Fixed bug with /robots.txt not being implicitly allowed as required by RFC 9309.
    &ndash; Thanks to @bensynapse for reporting.
-   Fixed bug with user-agent not followed by any directives not creating new group.
    &ndash; Thanks to @bensynapse for reporting.
-   Added Synapse rfc9309-test-vectors.json tests.

    RFC 9309 test vectors by Synapse, https://synapsereality.io/open-source/answer-crawler-check/rfc9309-test-vectors/, CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
-   Fixed user-agent to be more restrictive in what it accepts as a name to match RFC 9309.
-   Added parsing limit of 2097152 characters.
-   Changed the matching algorithm to a linear `O(N)` instead of `O(M*N)` worst case.

    The previous matching algorithm was one from google/robotstxt which was used to ensure compatibility with any edge cases. This new algorithm should be fully compatible.

    &ndash; Thanks to @EQSTLab for reporting.

## Version 3.0.1

-   Fixed bug with `https:` URLs defaulting to port `80` instead of `443` if no port is specified.
    &ndash; Thanks to @dskvr for reporting

    This affects comparing URLs with the default HTTPs port to URLs without it. 
    For example, comparing `https://example.com/` to `https://example.com:443/` or vice versa.

    They should be treated as equivalent but weren't due to the incorrect port
    being used for `https:`.

## Version 3.0.0

-   Changed to using global URL object instead of importing. &ndash; Thanks to @brendankenny

## Version 2.4.0:

-   Added Typescript definitions. &ndash; Thanks to @danhab99 for creating
-   Added SECURITY.md policy and CodeQL scanning

## Version 2.3.0:

-   Fixed bug where if the user-agent passed to `isAllowed()` / `isDisallowed()` is called "constructor" it would throw an error.
-   Added support for relative URLs. This does not affect the default behavior so can safely be upgraded.

    Relative matching is only allowed if both the robots.txt URL and the URLs being checked are relative.

    For example:

    ```js
    var robots = robotsParser('/robots.txt', [
        'User-agent: *',
        'Disallow: /dir/',
        'Disallow: /test.html',
        'Allow: /dir/test.html',
        'Allow: /test.html'
    ].join('\n'));

    robots.isAllowed('/test.html', 'Sams-Bot/1.0'); // false
    robots.isAllowed('/dir/test.html', 'Sams-Bot/1.0'); // true
    robots.isDisallowed('/dir/test2.html', 'Sams-Bot/1.0'); // true
    ```

## Version 2.2.0:

-   Fixed bug that with matching wildcard patterns with some URLs
    &ndash; Thanks to @ckylape for reporting and fixing
-   Changed matching algorithm to match Google's implementation in google/robotstxt
-   Changed order of precedence to match current spec

## Version 2.1.1:

-   Fix bug that could be used to causing rule checking to take a long time
    &ndash; Thanks to @andeanfog

## Version 2.1.0:

-   Removed use of punycode module API's as new URL API handles it
-   Improved test coverage
-   Added tests for percent encoded paths and improved support
-   Added `getMatchingLineNumber()` method
-   Fixed bug with comments on same line as directive

## Version 2.0.0:

This release is not 100% backwards compatible as it now uses the new URL APIs which are not supported in Node < 7.

-   Update code to not use deprecated URL module API's.
    &ndash; Thanks to @kdzwinel

## Version 1.0.2:

-   Fixed error caused by invalid URLs missing the protocol.

## Version 1.0.1:

-   Fixed bug with the "user-agent" rule being treated as case sensitive.
    &ndash; Thanks to @brendonboshell
-   Improved test coverage.
    &ndash; Thanks to @schornio

## Version 1.0.0:

-   Initial release.
