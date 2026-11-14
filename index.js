//@ts-check
var Robots = require('./Robots');

/**
 * @param {string} url
 * @param {string} contents
 */
module.exports = function (url, contents) {
	return new Robots(url, contents);
};
