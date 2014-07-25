goog.provide('servo.Property');

goog.require('servo.Base');
goog.require('servo.events.PropertyEvent');
/**
 * @fileoverview A class that represents a base property.
 */

/**
 * Create a class for a property of a specific type and give it a default value,
 * and optionally for dictionaries and lists a type limitation.
 * @param {Function} property
 * @param {boolean=} opt_nullable Whether or not this property is nullable.
 * @param {*=} opt_defaultValue Default value for the property.
 * @param {*=} opt_type A type restriction. Works only for dictionaries and
 *   lists.
 * @return {!Function}
 */
servo.createProperty = function (property, opt_nullable, opt_defaultValue, opt_type) {

  var tmpClass;

  /**
   * @constructor
   * @extends {servo.Property}
   */
  tmpClass = function () {
    goog.base(this);
  };
  goog.inherits(tmpClass, property);
  if (opt_nullable) {
    tmpClass.prototype.nullable_ = true;
  }
  if (goog.isDefAndNotNull(opt_defaultValue)) {
    tmpClass.prototype.default_ = opt_defaultValue;
  } else if (opt_nullable) {
    tmpClass.prototype.default_ = null;
  }
  if (opt_type) {
    tmpClass.prototype.innerCheckType = opt_type.prototype.checkType;
    tmpClass.prototype.innerDescribe = opt_type.prototype.describe;
  }
  return tmpClass;
};

/**
 * The abstract class that represents a property.
 * @param {*=} opt_val
 * @constructor
 * @extends {servo.Base}
 */
servo.Property = function (opt_val) {
  goog.base(this);
  this.createRoot_();
  this.setInitial_(opt_val);
};
goog.inherits(servo.Property, servo.Base);

/**
 * @protected
 * @type {boolean}
 */
servo.Property.prototype.nullable_ = false;

/**
 * @type {*}
 * @protected
 */
servo.Property.prototype.root_ = null;

/**
 * @private
 */
servo.Property.prototype.createRoot_ = function () {
  this.root_ = ko.observable();
};

/**
 * Sets initial value.
 * @param {*=} opt_val
 * @protected
 */
servo.Property.prototype.setInitial_ = function (opt_val) {
  if (opt_val !== undefined) {
    this.set(opt_val);
  } else {
    this.set(this.getDefault());
  }
};

/**
 * Return the value held by the property.
 * return {?*}
 */
servo.Property.prototype.get = function () {
  return /** @type {function()} */ (this.root_)();
};

/**
 * Return the value that should be used for sorting.
 * @return {*}
 */
servo.Property.prototype.getSortValue = function () {
  return this.get();
};

/**
 * Check to make sure a given value fits the property's type.
 * @param {*} val
 * @return {boolean}
 */
servo.Property.prototype.checkType = function (val) {
  return true;
};

/**
 * @protected
 * @type {*}
 */
servo.Property.prototype.default_ = null;

/**
 * Describes the type restriction.
 * @protected
 * @type {?function(): string}
 */
servo.Property.prototype.innerDescribe = null;

/**
 * Checks against the inner type restriction.
 * @protected
 * @type {?function(*): boolean}
 */
servo.Property.prototype.innerCheckType = null;

/**
 * Base setter for properties.
 *
 * @param {*} val
 * @param {boolean=} opt_silent If true, does not trigger a parent update event.
 * @return {boolean} If the submitted values were different.
 */
servo.Property.prototype.set = function (val, opt_silent) {
  if (!this.checkType(val)) {
    throw goog.string.subs(
      'Cannot set property with incorrect type. Expected %s.',
      this.describe()
    );
  }

  if (!this.isDifferent(val)) {
    return false;
  }

  /** @type {function(*)} */ (this.root_)(val);
  this.dispatchEvent(new servo.events.PropertyEvent(this, val, opt_silent));
  return true;
};

/**
 * Provides information about the property.
 * @return {string}
 */
servo.Property.prototype.describe = function () {
  return 'property';
};

/**
 * See if the given value is different from current value.
 * @param {*} value
 * @return {boolean}
 */
servo.Property.prototype.isDifferent = function (value) {
  return this.get() !== value;
};

/** @inheritDoc */
servo.Property.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  this.root_ = null;
};

/**
 * @return {*} The default value.
 */
servo.Property.prototype.getDefault = function () {
  return this.default_;
};
