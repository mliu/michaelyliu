goog.provide('ck.widgets.popovers.PopoverCloseTracker');

goog.require('ck.StatsClient');
goog.require('goog.Timer');
goog.require('goog.Disposable');
goog.require('goog.events.EventHandler');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ck.StatsClient=} opt_statsClient
 */
ck.widgets.popovers.PopoverCloseTracker = function (opt_statsClient) {
  goog.base(this);

  this.statsClient_ = opt_statsClient || new ck.StatsClient();

  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);

  this.timer_ = new goog.Timer(5000);
  this.registerDisposable(this.timer_);
};
goog.inherits(ck.widgets.popovers.PopoverCloseTracker, goog.Disposable);
goog.addSingletonGetter(ck.widgets.popovers.PopoverCloseTracker);

/**
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.open = function (conversionEventId) {
  var stat;

  if (conversionEventId === this.lastPopoverConversionEventId_) {
    stat = goog.string.subs('popover.%s.close.accidental', this.getKeyName_(conversionEventId));
    this.statsClient_.increment(stat);
    this.lastPopoverConversionEventId_ = '';
  }
};

/**
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.close = function (conversionEventId) {
  var stat;

  this.lastPopoverConversionEventId_ = conversionEventId;

  stat = goog.string.subs('popover.%s.close', this.getKeyName_(conversionEventId));
  this.statsClient_.increment(stat);

  this.timer_.stop();
  this.timer_.start();
  this.handler_.listenOnce(
    this.timer_,
    goog.Timer.TICK,
    function () {
      this.timer_.stop();
      this.lastPopoverConversionEventId_ = '';
    },
    undefined,
    this
  );
};

/**
 * @return {goog.Timer}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.getTimer = function () {
  return this.timer_;
};

/**
 * @private
 * @return {string}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.getKeyName_ = function (conversionEventId) {
  return conversionEventId.replace(/ /g, "_");
};

/**
 * @private
 * @type {string}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.lastPopoverConversionEventId_ = '';

/**
 * @private
 * @type {ck.StatsClient}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.statsClient_ = null;

/**
 * @private
 * @type {goog.Timer}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.timer_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.widgets.popovers.PopoverCloseTracker.prototype.handler_ = null;
