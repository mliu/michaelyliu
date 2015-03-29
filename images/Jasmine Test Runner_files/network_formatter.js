goog.provide('ck.format.NetworkFormatter');

goog.require('goog.string');
goog.require('goog.format');
goog.require('ck.format');

/**
 * @constructor
 */
ck.format.NetworkFormatter = function () {};

/**
 * @param {number} megabits
 * @return {string}
 */
ck.format.NetworkFormatter.prototype.formatMegabits = function (megabits) {
  if (megabits < 1000) {
    return goog.string.buildString(megabits, ' Mb');
  }

  return goog.string.buildString(Math.round(megabits / 100)/10, ' Gb');
};

/**
 * @param {number} megabits
 * @return {string}
 */
ck.format.NetworkFormatter.prototype.formatMegabitsPerSecond = function (megabits) {
  return this.formatMegabits(megabits) + ' / s';
};
