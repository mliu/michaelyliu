goog.provide('ck.data.service.UpdateStrategy');

/**
 * @constructor
 * @param {number} interval
 */
ck.data.service.UpdateStrategy = function (interval) {
  this.interval_ = interval;
};

/**
 * @return {boolean}
 */
ck.data.service.UpdateStrategy.prototype.shouldUpdate = goog.abstractMethod;

/**
 * @return {number}
 */
ck.data.service.UpdateStrategy.prototype.getInterval = function () {
  return this.interval_;
};

/**
 * @private
 * @type {number}
 */
ck.data.service.UpdateStrategy.prototype.interval_ = 0;