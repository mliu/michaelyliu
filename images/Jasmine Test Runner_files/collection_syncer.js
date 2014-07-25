goog.provide('ck.data.service.CollectionSyncer');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.events.EventHandler');
goog.require('servo.Store');

/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {function(new:servo.Collection)} CollectionType
 */
ck.data.service.CollectionSyncer = function (CollectionType) {
  goog.base(this);
  this.collections_ = [];

  this.aggregatedCollection_ = new CollectionType();
  this.aggregatedCollection_.setStore(servo.Store);
  this.handler_ = new goog.events.EventHandler(this);

  this.registerDisposable(this.aggregatedCollection_);
  this.registerDisposable(this.handler_);
};
goog.inherits(ck.data.service.CollectionSyncer, goog.Disposable);

/**
 * @param {servo.Collection} collection
 */
ck.data.service.CollectionSyncer.prototype.syncCollection = function (collection) {
  this.collections_.push(collection);

  this.handler_.listen(
    collection,
    [servo.events.EventType.SYNC,
     servo.events.EventType.ERROR,
     servo.events.EventType.TIMEOUT],
    this.handleNetworkEvent_
  );

  this.handler_.listen(
    collection,
    servo.events.EventType.ADD,
    this.handleAddEvent_
  );

  collection.forEach(function (model) {
    this.aggregatedCollection_.addModel(model);
  }, this);
};

/**
 * @private
 * @param {servo.events.RelatedEvent} e
 */
ck.data.service.CollectionSyncer.prototype.handleAddEvent_ = function (e) {
  this.aggregatedCollection_.addModel(e.relatedTarget);
};

/**
 * @private
 * @param {goog.events.Event} e
 */
ck.data.service.CollectionSyncer.prototype.handleNetworkEvent_ = function (e) {
  if (this.allCollectionsHaveErrorOrTimeout_()) {
    this.aggregatedCollection_.dispatchEvent(servo.events.EventType.ERROR);
  } else if (this.allCollectionsHaveResponded_()) {
    this.aggregatedCollection_.dispatchEvent(servo.events.EventType.SYNC);
  }
};

/**
 * @private
 * @return {boolean}
 */
ck.data.service.CollectionSyncer.prototype.allCollectionsHaveResponded_ = function () {
  return goog.array.every(this.collections_, function (collection) {
    return (collection.hasSynced() ||
            collection.hasTimeout() ||
            collection.hasError());
  });
};

/**
 * @private
 * @return {boolean}
 */
ck.data.service.CollectionSyncer.prototype.allCollectionsHaveErrorOrTimeout_ = function () {
  return goog.array.every(this.collections_, function (collection) {
    return collection.hasError() || collection.hasTimeout();
  });
};

/**
 * @return {servo.Collection}
 */
ck.data.service.CollectionSyncer.prototype.getAggregatedCollection = function () {
  return this.aggregatedCollection_;
};

/**
 * @private
 * @type {Array}
 */
ck.data.service.CollectionSyncer.prototype.collections_ = null;

/**
 * @private
 * @type {servo.Collection}
 */
ck.data.service.CollectionSyncer.prototype.aggregatedCollection_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.data.service.CollectionSyncer.prototype.handler_ = null;
