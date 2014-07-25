goog.provide('servo.Boolean');

goog.require('servo.Property');

/**
 * @fileoverview A class that represents a boolean property.
 */

/**
 * The class that represents a boolean property.
 * @param {boolean=} opt_val Initial value.
 * @constructor
 * @extends {servo.Property}
 */
servo.Boolean = function (opt_val) {
  goog.base(this, opt_val);
};
goog.inherits(servo.Boolean, servo.Property);

/** @inheritDoc */
servo.Boolean.prototype.checkType = function (val) {
  return typeof val === 'boolean' || this.nullable_ && goog.isNull(val);
};

/**
 * @protected
 * @type {boolean}
 */
servo.Boolean.prototype.default_ = true;

/** @inheritDoc */
servo.Boolean.prototype.describe = function () {
  return 'boolean';
};
