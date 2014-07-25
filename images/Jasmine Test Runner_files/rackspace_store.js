goog.provide('ck.data.RackspaceStore');

goog.require('ck.data.ProxyStore');
goog.require('ck.data.events.RackspaceErrorEvent');

/**
 * @constructor
 * @extends {ck.data.ProxyStore}
 */
ck.data.RackspaceStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.RackspaceStore, ck.data.ProxyStore);

/** @inheritDoc */
ck.data.RackspaceStore.prototype.constructErrorEvent_ = function (response, status) {
  response = /** @type {Object} */ (response);
  return new ck.data.events.RackspaceErrorEvent(this, response, status);
};
