goog.provide('ck.data.billing.CurrencyStore');

goog.require('ck.data.RackspaceStore');
goog.require('goog.string');

/**
 * @constructor
 * @extends {ck.data.RackspaceStore}
 */
ck.data.billing.CurrencyStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.billing.CurrencyStore, ck.data.RackspaceStore);

/** @inheritDoc */
ck.data.billing.CurrencyStore.prototype.getUrl = function () {
  return goog.string.buildString(
    goog.base(this, 'getUrl'),
    '/currency'
  );
};

/** @inheritDoc */
ck.data.billing.CurrencyStore.prototype.parseInternal = function (opt_rawData) {
  goog.base(this, 'parseInternal', {
    'currency': opt_rawData['currency-type']['billingCurrency']
  });
};
