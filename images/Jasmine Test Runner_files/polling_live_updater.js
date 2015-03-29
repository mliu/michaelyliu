goog.provide('ck.data.service.PollingLiveUpdater');

goog.require('ck.data.FetchingLiveUpdater');

/**
 * @constructor
 * @param {servo.Model|servo.Collection} thingToFetch
 * @extends {ck.data.FetchingLiveUpdater}
 */
ck.data.service.PollingLiveUpdater = function (thingToFetch) {
  goog.base(this, thingToFetch);
};
goog.inherits(ck.data.service.PollingLiveUpdater,
              ck.data.FetchingLiveUpdater);

/** @inheritDoc */
ck.data.service.PollingLiveUpdater.prototype.start = function () {
  this.onUpdateComplete();
};

/** @inheritDoc */
ck.data.service.PollingLiveUpdater.prototype.getInterval = function () {
  return this.interval_;
};

/**
 * @param {number} interval
 */
ck.data.service.PollingLiveUpdater.prototype.setInterval = function (interval) {
  this.interval_ = interval;
};

/**
 * @private
 * @type {number}
 */
ck.data.service.PollingLiveUpdater.prototype.interval_ = 15000;