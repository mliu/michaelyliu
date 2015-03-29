goog.provide('servo.GroupingProperty');

goog.require('servo.Property');

/**
 * @fileoverview An abstract class for properties that are groupings of values.
 *     (E.g. the Dictionary and List.)
 */

/**
 * An abstract class for properties that are groupings of values.
 *     (E.g. the Dictionary and List.)
 * @param {*=} opt_value Initial value.
 * @constructor
 * @extends {servo.Property}
 */
servo.GroupingProperty = function (opt_value) {
  goog.base(this, opt_value);
};
goog.inherits(servo.GroupingProperty, servo.Property);

/**
 * @param {*} value The value being checked.
 * @protected
 * @return {boolean}
 */
servo.GroupingProperty.prototype.checkEntryType_ = function (value) {
  if (this.innerCheckType) {
    return this.innerCheckType(value);
  }
  return true;
};

