goog.provide('ck.format.RAMFormatter');

goog.require('goog.string');
goog.require('goog.format');
goog.require('ck.format');

/**
 * @constructor
 */
ck.format.RAMFormatter = function () {};

/**
 * @param {number} megabytes
 */
ck.format.RAMFormatter.prototype.formatMegabytes = function (megabytes) {
  if (megabytes < 1024) {
    return goog.string.buildString(megabytes, ' MB');
  }

  return goog.string.buildString(Math.floor(megabytes / 1024), ' GB');
};
