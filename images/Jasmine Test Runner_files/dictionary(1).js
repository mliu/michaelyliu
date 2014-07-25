goog.provide('servo.Dictionary');

goog.require('goog.object');
goog.require('goog.array');
goog.require('goog.string');
goog.require('servo.GroupingProperty');

/**
 * @fileoverview A class that represents a dictionary property.
 */

/**
 * The class that represents a dictionary.
 * @param {Object=} opt_val Initial value.
 * @constructor
 * @extends {servo.GroupingProperty}
 */
servo.Dictionary = function (opt_val) {
  goog.base(this, opt_val);
};
goog.inherits(servo.Dictionary, servo.GroupingProperty);

/** @inheritDoc */
servo.Dictionary.prototype.setInitial_ = function (opt_val) {
  goog.base(this, 'setInitial_', opt_val);
};

/**
 * @type {number}
 * @private
 */
servo.Dictionary.prototype.length_ = 0;

/**
 * Returns the number of key value pairs stored in the dictionary.
 * @return {number?}
 */
servo.Dictionary.prototype.length = function () {
  // Returns 0 for null, despite internal value.
  return goog.isNull(this.root_) ? null : this.length_;
};

/** @inheritDoc */
servo.Dictionary.prototype.set = function (value, opt_silent) {
  if (goog.isString(arguments[0])) {
    this.setEntryByKey(arguments[0], arguments[1]);
    return true;
  }

  if (this.isDifferent(value, true)) {
    if (goog.isNull(value)) {
      this.root_ = null;
    } else {
      this.root_ = goog.object.clone(/** @type {Array} */(value));
    }
    this.updateLength_();
    this.dispatchEvent(new servo.events.PropertyEvent(this,
        goog.object.clone(this.root_), opt_silent));
    return true;
  }
  return false;
};

/**
 * Add an item with a key.
 * @param {string} key
 * @param {string|number|boolean} value
 */
servo.Dictionary.prototype.setEntryByKey = function (key, value) {
  if (!this.checkEntryType_(value)) {
    throw goog.string.buildString(
      'Invalid values, should be: ',
      this.describe()
    );
  }
  if (goog.isNull(this.root_)) {
    this.root_ = {};
  }
  if (this.root_[key] !== value) {
    if (!this.root_.hasOwnProperty(key)) {
      this.length_++;
    }
    this.root_[key] = value;
    this.dispatchEvent(new servo.events.PropertyEvent(this,
        goog.object.clone(/** @type {Object} */(this.root_))
    ));
  }
};

/**
 * Get the entire dictionary as an object literal.
 * @param {string=} opt_key
 * @return {*}
 */
servo.Dictionary.prototype.get = function (opt_key) {
  if (goog.isString(opt_key)) {
    return this.getEntryByKey(opt_key);
  } else if (goog.isNull(this.root_)) {
    return null;
  } else {
    return goog.object.clone(/** @type {Object} */(this.root_));
  }
};

/**
 * Get an entry by key.
 * @return {string|boolean|number|undefined}
 */
servo.Dictionary.prototype.getEntryByKey = function (key) {
  if (goog.isNull(this.root_)) {
    return undefined;
  }
  return this.root_[key];
};

/**
 * Update a dictionary with a new object. New keys are added with given values.
 * Existing keys are updated with given values. Keys in dictionary but not in
 * given object are ignored.
 * @param {!Object} updates
 */
servo.Dictionary.prototype.update = function (updates) {
  if (!this.checkType(updates)) {
    throw goog.string.buildString('Invalid type, should be: ', this.describe());
  }
  if (!this.isDifferent(updates)) {
    return;
  }
  goog.object.extend(/** @type {Object} */(this.root_), updates);
  this.dispatchEvent(new servo.events.PropertyEvent(this, this.root_));
};

/**
 * Remove an item from the dictionary.
 * @param {string} key The key of the item to remove.
 */
servo.Dictionary.prototype.removeEntryByKey = function (key) {
  this.remove_(key);
  this.dispatchEvent(new servo.events.PropertyEvent(
    this,
    goog.object.clone(/** @type {Object} */(this.root_))
  ));
};

/**
 * Remove items from the dictionary.
 * @param {Array.<string>} key The keys of the items to remove.
 */
servo.Dictionary.prototype.removeEntriesByKeys = function (key) {
  goog.array.forEach(key, this.remove_, this);
  this.dispatchEvent(new servo.events.PropertyEvent(
    this,
    goog.object.clone(/** @type {Object} */(this.root_))
  ));
};

/**
 * Remove an item from the dictionary.
 * @param {!string} key The key of the item to remove.
 */
servo.Dictionary.prototype.remove_ = function (key) {
  if (goog.isNull(this.root_) || !this.root_.hasOwnProperty(key)) {
    throw 'Invalid key, not in dictionary.';
  }
  delete this.root_[key];
  this.length_--;
};

/**
 * Update the length parameter.
 * @private
 */
servo.Dictionary.prototype.updateLength_ = function () {
  // When null, keeps the internal count at 0 for convenience.
  if (goog.isNull(this.root_)) {
    this.length_ = 0;
  } else {
    this.length_ = goog.object.getCount(
      /** @type {Object} */(this.root_)
    );
  }
};

/** @inheritDoc */
servo.Dictionary.prototype.checkType = function (val) {
  if (this.nullable_ && goog.isNull(val)) {
    return true;
  }
  return !goog.isArrayLike(val) && goog.isObject(val) && goog.object.every(
    val,
    this.checkEntryType_,
    this
  );
};

/** @inheritDoc */
servo.Dictionary.prototype.describe = function () {
  if (this.innerDescribe) {
    return goog.string.buildString('dictionary{', this.innerDescribe(), '}');
  } else {
    return 'dictionary';
  }
};

/**
 * Returns true if given values are different from current values.
 * @param {*} values
 * @param {boolean=} opt_exact If true, given values must not just be the same
 *    but cannot be missing any current properties on this.root_ this function
 *    to return true.
 * @return {boolean}
 */
servo.Dictionary.prototype.isDifferent = function(values, opt_exact) {
  var numFound, different;
  if (!this.checkType(values)) {
    throw goog.string.buildString('Invalid values, should be: ',
        this.describe());
  }
  if (goog.isNull(this.root_)) {
    return !goog.isNull(values);
  }
  numFound = 0;
  different = false;
  goog.object.forEach(/** @type {Array} */ (values), function (value, key) {
    numFound++;
    if (this.root_[key] !== value) {
      different = true;
    }
  }, this);
  if (!different && opt_exact) {
    return goog.object.getCount(
        /** @type {Object} */(this.root_)) !== numFound;
  }
  return different;
};

/** @inheritDoc */
servo.Dictionary.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  delete this.length_;
};

/**
 * @return {Object} The default value.
 */
servo.Dictionary.prototype.getDefault = function () {
  if (this.nullable_ && goog.isNull(this.default_)) {
    return null;
  }
  return this.default_ ? goog.object.clone(
    /** @type {Object} */(this.default_)) : {};
};
