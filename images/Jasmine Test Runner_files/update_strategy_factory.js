goog.provide('ck.data.service.UpdateStrategyFactory');

goog.require('ck.data.service.NeverUpdateStrategy');

/**
 * @constructor
 */
ck.data.service.UpdateStrategyFactory = function () {
  this.updateMap_ = {};
};
goog.addSingletonGetter(ck.data.service.UpdateStrategyFactory);

/**
 * @param {servo.Model|servo.Collection} dependency
 * @param {ck.data.service.UpdateStrategy} strategy
 */
ck.data.service.UpdateStrategyFactory.prototype.updateWithStrategy = function (dependency, strategy) {
  this.updateMap_[goog.getUid(dependency)] = strategy;
};

/**
 * @return {ck.data.service.UpdateStrategy}
 */
ck.data.service.UpdateStrategyFactory.prototype.getStrategy = function (dependency) {
  var uid;

  uid = goog.getUid(dependency);
  if (!goog.isDefAndNotNull(this.updateMap_[uid])) {
    return new ck.data.service.NeverUpdateStrategy();
  }

  return this.updateMap_[uid];
};

/**
 * @private
 * @type {Object.<number,ck.data.service.UpdateStrategy>}
 */
ck.data.service.UpdateStrategyFactory.prototype.updateMap_ = null;
