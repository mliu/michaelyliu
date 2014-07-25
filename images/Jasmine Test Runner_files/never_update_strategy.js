goog.provide('ck.data.service.NeverUpdateStrategy');

goog.require('ck.data.service.UpdateStrategy');

/**
 * @constructor
 * @extends {ck.data.service.UpdateStrategy}
 */
ck.data.service.NeverUpdateStrategy = function () {
  goog.base(this, 0);
};
goog.inherits(ck.data.service.NeverUpdateStrategy,
              ck.data.service.UpdateStrategy);

/** @inheritDoc */
ck.data.service.NeverUpdateStrategy.prototype.shouldUpdate = function () {
  return false;
};