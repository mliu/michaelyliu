goog.provide('ck.data.FetchingLiveUpdater');

goog.require('servo.events');
goog.require('servo.Model');
goog.require('servo.Collection');
goog.require('ck.data.LiveUpdater');

/**
 * @constructor
 * @param {servo.Model|servo.Collection} thingToFetch
 * @extends {ck.data.LiveUpdater}
 */
ck.data.FetchingLiveUpdater = function (thingToFetch) {
  goog.base(this);

  this.thingToFetch_ = thingToFetch;

  this.handler_.listen(
    this.thingToFetch_,
    [servo.events.EventType.SYNC, servo.events.EventType.TIMEOUT],
    goog.bind(this.onUpdateComplete, this)
  );
};
goog.inherits(ck.data.FetchingLiveUpdater, ck.data.LiveUpdater);

/** @inheritDoc */
ck.data.FetchingLiveUpdater.prototype.update = function () {
  this.thingToFetch_.fetch();
};

/**
 * @type {servo.Model|servo.Collection}
 */
ck.data.FetchingLiveUpdater.prototype.thingToFetch_ = null;