goog.provide('ck.data.ProviderMixin');

/**
 * @this {servo.Model|servo.Collection}
 * @param {ck.data.Provider} provider
 * @param {boolean=} opt_setChildren Optionally set provider on all child items
 *    (i.e. All models in a collection).
 */
ck.data.ProviderMixin.setProvider = function (provider, opt_setChildren) {
  var store;

  store = this.getStore();

  if (goog.isFunction(store.setProviderId)) {
    store.setProviderId(provider.id());
  }

  if (opt_setChildren && this instanceof servo.Collection) {
    this.forEach(function (model) {
      if (goog.isFunction(model.setProvider)) {
        model.setProvider(provider);
      }
    });
  }

  /**
  * @private
  * @type {ck.data.Provider}
  */
  this.provider_ = provider;
};

/**
 * @this {servo.Model|servo.Collection}
 * @return {ck.data.Provider}
 */
ck.data.ProviderMixin.getProvider = function () {
  return this.provider_;
};
