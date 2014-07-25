goog.provide('servo.Base');

goog.require('goog.events.EventTarget');

/**
 * @fileoverview The base file that all servo classes inherit from.
 */

/**
 * The class that represents the base servo functions.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
servo.Base = function () {
  goog.base(this);
};
goog.inherits(servo.Base, goog.events.EventTarget);

/**
 * Indicates if an attempt to fetch the data for this object resulted in
 * an ERROR event.
 * @return {boolean}
 */
servo.Base.prototype.hasError = function () {
  return this.hasError_;
};

/**
 * Indicates if an attempt to fetch the data for this object resulted in
 * a TIMEOUT event.
 * @return {boolean}
 */
servo.Base.prototype.hasTimeout = function () {
  return this.hasTimeout_;
};

/**
 * Indicates whether the object has synced at least once.
 * @return {boolean}
 */
servo.Base.prototype.hasSynced = function () {
  return this.shouldAlwaysFetch() ? false : this.hasSynced_;
};

/**
 * Indicates whether this object should always be synced
 */
servo.Base.prototype.shouldAlwaysFetch = function () {
  return false;
};

/**
 * Indicates whether the object is currently being loaded, e.g. has not yet
 * SYNCed and is in the process of fetching data in order to SYNC.
 */
servo.Base.prototype.isLoading = function () {
  return this.isLoading_;
};

/**
 */
servo.Base.prototype.resetLoadedStatus = function () {
  this.isLoading_ = false;
  this.hasSynced_ = false;
  this.hasTimeout_ = false;
  this.hasError_ = false;
};

/**
 * Forward an event from a handler to this servo class.
 * @param {!goog.events.Event} event
 * @protected
 */
servo.Base.prototype.forwardEvent_ = function (event) {
  this.dispatchEvent(event);
};

/**
 * @param {goog.events.Event} event
 * @protected
 */
servo.Base.prototype.updateLoadedStatus = function (event) {
  this.hasError_ = event.type === servo.events.EventType.ERROR;
  this.hasTimeout_ = event.type === servo.events.EventType.TIMEOUT;
  if (!this.hasSynced_ && event.type === servo.events.EventType.SYNC) {
    this.hasSynced_ = true;
  }

  if (this.hasError_) {
    this.error_ = event;
    this.timeout_ = null;
  }

  if (this.hasTimeout_) {
    this.timeout_ = event;
    this.error_ = null;
  }
};

/**
 * @return {Array.<servo.events.StoreErrorEvent>}
 */
servo.Base.prototype.getErrors = function () {
  return [this.error_];
};

/**
 * @return {Array.<servo.events.StoreTimeoutEvent>}
 */
servo.Base.prototype.getTimeouts = function () {
  return [this.timeout_];
};

/**
 * @type {boolean}
 * @protected
 */
servo.Base.prototype.hasError_ = false;

/**
 * @type {boolean}
 * @protected
 */
servo.Base.prototype.hasTimeout_ = false;

/**
 * @type {goog.events.Event}
 * @protected
 */
servo.Base.prototype.error_ = null;

/**
 * @type {goog.events.Event}
 * @protected
 */
servo.Base.prototype.timeout_ = null;

/**
 * @type {boolean}
 * @protected
 */
servo.Base.prototype.hasSynced_ = false;

/**
 * @type {boolean}
 * @protected
 */
servo.Base.prototype.isLoading_ = false;
