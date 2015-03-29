goog.provide('ck.data.ProxyModel');

goog.require('servo.Model');
goog.require('servo.String');
goog.require('servo.Property');
goog.require('ck.data.ProviderMixin');

/**
 * @constructor
 * @param {Object=} opt_values
 * @param {servo.Store=} opt_store
 * @extends {servo.Model}
 */
ck.data.ProxyModel = function (opt_values, opt_store){
  goog.base(this, opt_values, opt_store);
};
goog.inherits(ck.data.ProxyModel, servo.Model);

/**
 * @param {ck.data.Provider} provider
 */
ck.data.ProxyModel.prototype.setProvider = function(provider){};

/**
 * @return {ck.data.Provider}
 */
ck.data.ProxyModel.prototype.getProvider = goog.abstractMethod;

/**
 * @return {string}
 */
ck.data.ProxyModel.prototype.getRegionName = function () { return ''; };

/**
 * Creates a model that has a ck.data.Provider associated with it.
 *
 * @param {!Object.<string, servo.Property|servo.Collection>} properties
 * @param {!function (new:servo.Store): undefined} store
 * @return {function (new:ck.data.ProxyModel): ?}
 */
ck.data.createProxyModel = function (properties, store) {
  var ModelClass;

  goog.object.extend(properties, {
    'internalId': servo.createProperty(servo.String, false, ''),
    'providerId': servo.createProperty(servo.String, false, '')
  });

  ModelClass = servo.createModel(properties, store);

  ModelClass.prototype.set = function (values, opt_silent) {
    var provider;

    goog.base(this, 'set', values, opt_silent);

    if (values && values['providerId']) {
      provider = ck.data.Providers.getInstance().getModelById(
        values['providerId']
      );
      if (provider) {
        this.setProvider(provider);
      }
    }
  };

  /**
   * @param {ck.data.Provider} provider
   */
  ModelClass.prototype.setProvider = function (provider) {
    ck.data.ProviderMixin.setProvider.call(this, provider);
    this.set('providerId', provider.id());
  };

  /**
   * @return {string}
   */
  ModelClass.prototype.getRegionName = function () {
    var provider;

    provider = this.getProvider();
    return provider && provider.getName();
  };

  /**
   * @return {ck.data.Provider}
   */
  ModelClass.prototype.getProvider = function () {
    var provider;

    provider = ck.data.ProviderMixin.getProvider.call(this);
    if (!provider) {
      // model has been added but has not had a provider object set yet, so
      // look up by id
      //
      // This can happen if there is an ADD handler that fires that expects
      // the provider object to be set, since ck.data.ProxyCollection only sets
      // the provider after an add.
      provider = ck.data.Providers.getInstance().getModelById(
        this.get('providerId')
      );
    }

    return provider;
  };

  return ModelClass;
};
