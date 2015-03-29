goog.provide('servo.List');

goog.require('goog.array');
goog.require('servo.GroupingProperty');
goog.require('goog.string');

/**
 * @fileoverview A class that represents a list property.
 */

/**
 * The class that represents a list.
 * @param {Array=} opt_val Initial value.
 * @constructor
 * @extends {servo.GroupingProperty}
 */
servo.List = function (opt_val) {
  goog.base(this, opt_val);
};
goog.inherits(servo.List, servo.GroupingProperty);

/**
 * @type {Array}
 * @protected
 */
servo.List.prototype.root_ = null;

/**
 * Add an item to the end of the list.
 * @param {string|number|boolean} value
 */
servo.List.prototype.addEntry = function (value) {
  if (!this.checkEntryType_(value)) {
    throw goog.string.buildString(
      'Invalid type for list, should be: ',
      this.describe()
    );
  }
  if (goog.isNull(this.root_)) {
    this.root_ = [];
  }
  this.root_.push(value);
  this.dispatchEvent(new servo.events.PropertyEvent(this, this.root_));
};

/**
 * Add an item to the end of the list. Can either add one item or an array
 * of items.
 * @param {Array.<string|number|boolean>} values
 */
servo.List.prototype.addEntries = function (values) {
  if (!this.checkType(values)) {
    throw goog.string.buildString(
      'Invalid type for list, should be: ',
      this.describe()
    );
  }
  if (goog.isNull(this.root_)) {
    this.root_ = [];
  }
  this.root_ = goog.array.concat(this.root_, values);
  this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
};

/**
 * Add an item to the list at a specific index. This
 * will push all subsequent items in the list up by one.
 * @param {string|number|boolean} value
 * @param {number} index
 */
servo.List.prototype.addEntryAt = function (value, index) {
  if (!this.checkEntryType_(value)) {
    throw goog.string.buildString(
      'Invalid type for list, should be: ',
      this.describe()
    );
  }
  if (goog.isNull(this.root_)) {
    this.root_ = [];
  }
  if (index > this.root_.length) {
    throw 'Given index is too large.';
  }
  goog.array.insertAt(this.root_, value, index);
  this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
};

/**
 * Add items to the list at a specific index. This
 * will push all subsequent items in the list.
 * @param {Array.<string|number|boolean>} values
 * @param {number} index
 */
servo.List.prototype.addEntriesAt = function (values, index) {
  if (!this.checkType(values)) {
    throw goog.string.buildString(
      'Invalid type for list, should be: ',
      this.describe()
    );
  }
  if (index > this.root_.length) {
    throw 'Given index is too large.';
  }
  if (values.length > 0) {
    goog.array.insertArrayAt(this.root_, values, index);
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
  }
};

/**
 * Get the list.
 * return {Array}
 */
servo.List.prototype.get = function () {
  return goog.isNull(this.root_) ? null : goog.array.clone(this.root_);
};

/**
 * Get an entry from the list.
 * @param {number=} index
 * return {string|number|boolean}
 */
servo.List.prototype.getEntryAt = function (index) {
  if (goog.isNull(this.root_)) {
    return undefined;
  }
  return this.root_[index];
};

/**
 * Return the length of the list.
 * @return {number}
 */
servo.List.prototype.length = function () {
  return this.root_.length;
};

/**
 * Returns the index of a value.
 * @param {number|string|boolean} value
 * @return {number?}
 */
servo.List.prototype.indexOf = function (value) {
  if (goog.isNull(this.root)) {
    return -1;
  }
  return goog.array.indexOf(this.root_, value);
};

/**
 * Remove item at index if it exists.
 * @param {number} index
 * @return {boolean} Returns true if successful, false otherwise.
 */
servo.List.prototype.removeEntryAt = function (index) {
  var result;
  result = goog.array.removeAt(this.root_, index);
  if (result) {
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
  }
  return result;
};

/**
 * Remove an item.
 * @param {string|boolean|number} value
 * @return {boolean} Returns true if successful, false otherwise.
 */
servo.List.prototype.removeEntry = function (value) {
  var result;
  if (goog.isNull(this.root_)) {
    return false;
  }
  result = goog.array.remove(this.root_, value);
  if (result) {
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
  }
  return result;
};

/**
 * Remove items by value. Returns true if at least one item was removed.
 * @param {Array} values
 * @return {boolean} Returns true if successful, false otherwise.
 */
servo.List.prototype.removeEntries = function (values) {
  var result;
  result = goog.array.reduce(values, function (previous, current) {
    return goog.array.remove(this.root_, current) || previous;
  }, false, this);
  if (result) {
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
  }

  return /** @type {boolean} */ (result);
};

/** @inheritDoc */
servo.List.prototype.set = function (value, opt_silent) {
  if (this.isDifferent(value)) {
    if (goog.isNull(value)) {
      this.root_ = null;
    } else {
      this.root_ = goog.array.clone(/** @type {Array} */ (value));
    }
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get(), opt_silent));
    return true;
  }
  return false;
};

/**
 * @private
 * @return {number}
 */
servo.List.prototype.getEffectiveLength_ = function () {
  return goog.isNull(this.root_) ? 0 : this.root_.length;
};

/**
 * Set the value for an entry at a given index.
 * @param {string|number|boolean} value
 * @param {number} index
 */
servo.List.prototype.setEntryAt = function (value, index) {
  if (!this.checkEntryType_(value)) {
    throw 'Invalid type.';
  }
  if (index > this.root_.length) {
    throw 'Invalid index.';
  }
  if (this.root_[index] !== value) {
    this.root_[index] = value;
    this.dispatchEvent(new servo.events.PropertyEvent(this, this.get()));
  }
};

/**
 * Iterate through a list as you would through an array.
 * Modifying the list during a forEach will not affect the iteration.
 * @param {Function} callback
 */
servo.List.prototype.forEach = function (callback) {
  if (goog.isArray(this.root_)) {
    goog.array.forEach(goog.array.clone(this.root_), callback);
  }
};

/** @inheritDoc */
servo.List.prototype.checkType = function (val) {
  if (this.nullable_ && goog.isNull(val)) {
    return true;
  }
  return (goog.isArray(val) &&
          goog.array.every(/** @type {Array} */ (val), this.checkEntryType_, this));
};

/** @inheritDoc */
servo.List.prototype.describe = function () {
  if (this.innerDescribe) {
    return goog.string.buildString('list(', this.innerDescribe(),
          ')');
  } else {
    return 'list';
  }
};

/** @inheritDoc */
servo.List.prototype.isDifferent = function (values) {
  if (!this.checkType(values)) {
    throw goog.string.buildString(
      'Invalid type for list, should be: ',
      this.describe()
    );
  }

  values = /** @type {Array} */ (values);

  if (goog.isNull(this.root_)) {
    return !goog.isNull(values);
  }
  return !goog.array.equals(this.root_, values);
};

/**
 * @return {Array} The default value.
 */
servo.List.prototype.getDefault = function () {
  var def;
  if (this.nullable_ && goog.isNull(this.default_)) {
    return null;
  }
  def = /** @type {Array}*/(this.default_);
  return def ? goog.array.clone(def) : [];
};
