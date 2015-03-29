goog.provide('servo.Number');

goog.require('servo.Property');

/**
 * @fileoverview A class that represents a number property.
 */

/**
 * The class that represents a number.
 * @param {number=} opt_val Initial value.
 * @constructor
 * @extends {servo.Property}
 */
servo.Number = function (opt_val) {
  goog.base(this, opt_val);
};
goog.inherits(servo.Number, servo.Property);

/** @inheritDoc */
servo.Number.prototype.checkType = function (val) {
  return typeof val === 'number' || this.nullable_ && goog.isNull(val);
};

/** @inheritDoc */
servo.Number.prototype.describe = function () {
  return 'number';
};

/**
 * @type {number?}
 * @protected
 */
servo.Number.prototype.default_ = 0;
