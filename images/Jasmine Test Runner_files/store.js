goog.provide('servo.Store');
goog.require('servo.events.EventType');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('goog.array');

/**
 * @fileoverview A store is the engine that powers a collection and model
 * persistence.
 */

/**
 * The abstract base class that represents a store.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
servo.Store = function () {
  goog.base(this);
  /**
   * @private
   * @type {Array.<servo.Store>}
   */
  this.associatedStores_ = [];
};
goog.inherits(servo.Store, goog.events.EventTarget);

/**
 * By default, whether or not the sync gets dispatched with this flag set; can
 *     still be overridden by parseInternal args.
 *
 * @param {boolean} withRemoval
 */
servo.Store.prototype.setDefaultWithRemoval = function (withRemoval) {
  this.withRemoval_ = withRemoval;
};

/**
 * @private
 * @type {boolean}
 */
servo.Store.prototype.withRemoval_ = false;

/**
 * Save current state.
 * @param {!Object} data
 */
servo.Store.prototype.save = goog.nullFunction;

/**
 * Fetch updated state.
 * @param {*=} opt_args
 */
servo.Store.prototype.fetch =  function (opt_args) {
  this.fetchInternal.apply(this, arguments);
};

/**
 * Fetch updated state.
 * {Object.<string>=} opt_args
 */
servo.Store.prototype.fetchInternal = goog.nullFunction;

/**
 * Delete the current item; be sure to call `this.dispatchDelete`
 *   after success.
 * @param {*=} opt_args
 */
servo.Store.prototype.destroy = function (opt_args) {};

/**
 * Convenience function for dispatching DELETE once a destroy call is complete.
 */
servo.Store.prototype.dispatchDelete = function () {
  this.dispatchEvent(servo.events.EventType.DELETE);
};

/**
 * Set an array of stores associated to this one.  After this store parses
 *   raw data, it calls parse on its associated stores with the same data.
 *   (Note: this is a one-way relationship; associated stores won't pass
 *   data back to this store.)
 *
 * @param {!Array.<servo.Store>} stores
 */
servo.Store.prototype.setAssociatedStores = function (stores) {
  this.associatedStores_ = goog.array.clone(stores);
};

/**
 * Add a store with an association to this one.  After this store parses
 *   raw data, it calls parse on its associated stores with the same data.
 *   (Note: this is a one-way relationship; associated stores won't pass
 *   data back to this store.)
 *
 * @param {!servo.Store} store
 */
servo.Store.prototype.addAssociatedStore = function (store) {
  this.associatedStores_.push(store);
};

/**
 * Clears associated stores.
 */
servo.Store.prototype.clearAssociatedStores = function () {
  this.associatedStores_ = [];
};

/**
 * @return {Array.<servo.Store>}
 */
servo.Store.prototype.getAssociatedStores = function () {
  return goog.array.clone(this.associatedStores_);
};

/**
 * Parse raw data.  Should not override this function; override parseInternal.
 *
 * @param {?Object=} opt_rawData
 * @param {boolean=} opt_withRemoval
 */
servo.Store.prototype.parse = function (opt_rawData, opt_withRemoval) {
  this.parseInternal(opt_rawData, opt_withRemoval);
  if (this.associatedStores_) {
    goog.array.forEach(
      this.associatedStores_,
      function (store) {
        if (!store.isDisposed()) {
          store.parse(opt_rawData, opt_withRemoval);
        }
      }
    );
  }
};

/**
 * Should be overwritten for inheriting classes (without calling goog.base).
 *
 * @param {?(Object|Array)=} opt_rawData
 * @param {boolean=} opt_withRemoval
 * @protected
 */
servo.Store.prototype.parseInternal = function (opt_rawData, opt_withRemoval) {
  this.setParsedData(opt_rawData, undefined, opt_withRemoval);
};

/**
 * Set the parsed data and provide an optional event to fire when
 * finished.
 * @param {?(Object|Array)=} opt_parsedData
 * @param {string|number=} opt_id
 * @param {boolean=} opt_withRemoval
 * @protected
 */
servo.Store.prototype.setParsedData = function (opt_parsedData, opt_id, opt_withRemoval) {
  var event;
  if (goog.isArray(opt_parsedData)) {
    opt_parsedData = goog.array.clone(opt_parsedData);
  } else if (goog.isObject(opt_parsedData)) {
    opt_parsedData = goog.object.clone(opt_parsedData);
  }
  event = new servo.events.StoreSyncedEvent(
    this,
    opt_parsedData,
    opt_id,
    undefined,
    goog.isDefAndNotNull(opt_withRemoval) ?
        opt_withRemoval : this.withRemoval_
  );
  this.dispatchEvent(event);
};

/** @inheritDoc */
servo.Store.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  this.associatedStores_ = null;
};
