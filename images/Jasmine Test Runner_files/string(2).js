goog.provide('servo.String');

goog.require('servo.Property');

/**
 * @fileoverview A class that represents a string property.
 */

/**
 * The class that represents a string property.
 * @param {boolean=} opt_val Initial value.
 * @constructor
 * @extends {servo.Property}
 */
servo.String = function (opt_val) {
  goog.base(this, opt_val);
};
goog.inherits(servo.String, servo.Property);

/** @inheritDoc */
servo.String.prototype.checkType = function (val) {
  return typeof val === 'string' || this.nullable_ && goog.isNull(val);
};

/**
 * @protected
 * @type {string}
 */
servo.String.prototype.default_ = '';

/** @inheritDoc */
servo.String.prototype.describe = function () {
  return 'string';
};
