goog.provide('ck.data.LiveUpdater');

goog.require('goog.async.Delay');
goog.require('goog.Disposable');
goog.require('goog.events.EventHandler');
goog.require('ck.utility.PageVisibility');
goog.require('goog.dom');
goog.require('ck.StatsClient');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {Document=} opt_document
 * @param {ck.StatsClient=} opt_statsClient
 */
ck.data.LiveUpdater = function (opt_document, opt_statsClient) {
  this.handler_ = new goog.events.EventHandler(this);
  this.visibility_ = new ck.utility.PageVisibility(
    opt_document || goog.dom.getDocument()
  );
  this.statsClient_ = opt_statsClient || new ck.StatsClient();

  this.isFirstUpdate_ = true;
  this.delay_ = new goog.async.Delay(this.performNextUpdate, undefined, this);
  this.state_ = ck.data.LiveUpdater.States.ACTIVE;

  this.registerDisposable(this.handler_);
  this.registerDisposable(this.visibility_);
  this.registerDisposable(this.delay_);
};
goog.inherits(ck.data.LiveUpdater, goog.Disposable);

/**
 * @protected
 * @type {?boolean}
 */
ck.data.LiveUpdater.prototype.isFirstUpdate_ = null;

/**
 * @protected
 * @type {goog.events.EventHandler}
 */
ck.data.LiveUpdater.prototype.handler_ = null;

/**
 * @protected
 * @type {ck.utility.PageVisibility}
 */
ck.data.LiveUpdater.prototype.visibility_ = null;

/**
 * @private
 * @type {ck.StatsClient}
 */
ck.data.LiveUpdater.prototype.statsClient_ = null;

/**
 * @protected
 * @return {number}
 */
ck.data.LiveUpdater.prototype.getInterval = function () {
  // By default poll every 15 seconds.  Subclasses should
  // override this to determine custom polling intervals.
  return 15000;
};

/**
 * Subclasses should override this to determine exactly how updates will
 * be performed (e.g. Servo model fetch, cache update)
 *
 */
ck.data.LiveUpdater.prototype.update = goog.abstractMethod;

/**
 * Called manually by subclasses to update on an interval.
 */
ck.data.LiveUpdater.prototype.onUpdateComplete = function () {
  this.delay_.start(this.getInterval());
};

/**
 * @protected
 */
ck.data.LiveUpdater.prototype.performNextUpdate = function () {
  if (this.state_ !== ck.data.LiveUpdater.States.ACTIVE) {
    this.state_ = ck.data.LiveUpdater.States.WAITING_FOR_RESUME;
  } else if (this.isFirstUpdate() || this.visibility_.isVisible()) {
    this.update();

    if (this.isFirstUpdate()) {
      this.statsClient_.increment('live_updater.initial_update');
    } else {
      this.statsClient_.increment('live_updater.timer_update');
    }

    this.isFirstUpdate_ = false;
  } else {
    this.handler_.listenOnce(
      this.visibility_,
      ck.utility.PageVisibility.EventType.VISIBLE,
      function (e) {
        this.update();
      }
    );
  }
};

/**
 * @protected
 * @return {?boolean}
 */
ck.data.LiveUpdater.prototype.isFirstUpdate = function () {
  return this.isFirstUpdate_;
};

/**
 */
ck.data.LiveUpdater.prototype.start = function () {
  this.update();
};

/**
 */
ck.data.LiveUpdater.prototype.pause = function () {
  if (this.state_ === ck.data.LiveUpdater.States.ACTIVE) {
    this.state_ = ck.data.LiveUpdater.States.PAUSED;
  }
};

/**
 * Resumes the live updater.  Will immediately call update if the previous delay
 * fired.
 */
ck.data.LiveUpdater.prototype.resume = function () {
  var previousState;

  previousState = this.state_;
  this.state_ = ck.data.LiveUpdater.States.ACTIVE;
  if (previousState === ck.data.LiveUpdater.States.WAITING_FOR_RESUME) {
    this.update();
  }
};

/**
 * Getter for testing.
 * @return {ck.utility.PageVisibility}
 */
ck.data.LiveUpdater.prototype.getPageVisibility = function () {
  return this.visibility_;
};

/**
 * @enum {string}
 */
ck.data.LiveUpdater.States = {
  PAUSED: 'PAUSED',
  WAITING_FOR_RESUME: 'WAITING_FOR_RESUME',
  ACTIVE: 'ACTIVE'
};