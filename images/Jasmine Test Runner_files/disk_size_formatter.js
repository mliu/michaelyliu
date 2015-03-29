goog.provide('ck.format.DiskFormatter');

goog.require('ck.format');

/**
 * @constructor
 */
ck.format.DiskFormatter = function () {};

/**
 * @param {number} disk
 */
ck.format.DiskFormatter.prototype.formatGigabytes = function (disk) {
  return ck.format.fileSize(disk * 1024 * 1024 * 1024, 1);
};
