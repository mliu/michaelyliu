goog.provide('ck.data.billing.Currency');

goog.require('ck.data.ProxyModel');
goog.require('ck.data.billing.CurrencyStore');
goog.require('servo.Property');
goog.require('servo.String');
goog.require('goog.string.format');

/**
 * @constructor
 * @param {Object=} opt_values
 * @extends {ck.data.ProxyModel}
 */
ck.data.billing.Currency = ck.data.createProxyModel({
  'currency': servo.createProperty(servo.String)
}, ck.data.billing.CurrencyStore);

/**
 * @param {number|string} amount
 * @param {string=} opt_roundFormat
 * @return {string}
 */
ck.data.billing.Currency.prototype.getCurrencyString = function (amount, opt_roundFormat) {
  var currencyType;

  currencyType = this.get('currency');
  opt_roundFormat = opt_roundFormat || '%.2f';

  return goog.string.format(
    goog.string.buildString('%s', opt_roundFormat),
    ck.data.billing.Currency.SymbolMap[currencyType],
    parseFloat(amount)
  );
};

/**
 * @param {number|string} amount
 * @return {string}
 */
ck.data.billing.Currency.prototype.getCurrencyStringNoRound = function (amount) {
  var currencyType, formattedAmount, parts;

  currencyType = this.get('currency');

  formattedAmount = parseFloat(amount).toString();
  parts = formattedAmount.split('.');

  if (parts.length === 1 || parts[1].length < 2) {
    formattedAmount = goog.string.format("%.2f", parseFloat(formattedAmount));
  }
  return goog.string.subs('%s%s',
    ck.data.billing.Currency.SymbolMap[currencyType],
    formattedAmount
  );
};


/**
 * @param {number|string} amount
 * @return {string}
 */
ck.data.billing.Currency.prototype.getSubCurrencyStringNoRound = function (amount) {
  var currencyType;

  currencyType = this.get('currency');

  return goog.string.subs('%s%s',
    amount,
    ck.data.billing.Currency.SubSymbolMap[currencyType]
  );
};

/**
 * @return {boolean}
 */
ck.data.billing.Currency.prototype.isGBP = function () {
  return this.get('currency') === ck.data.billing.Currency.Type.GBP;
};

/**
 * @return {boolean}
 */
ck.data.billing.Currency.prototype.isUSD = function () {
  return this.get('currency') === ck.data.billing.Currency.Type.USD;
};

/**
 * @enum {string}
 */
ck.data.billing.Currency.Type = {
  USD: 'USD',
  GBP: 'GBP'
};

/**
 * @enum {string}
 */
ck.data.billing.Currency.SymbolMap = {
  'USD': '$',
  'GBP': '\u00A3'
};

/**
 * @enum {string}
 */
ck.data.billing.Currency.SubSymbolMap = {
  'USD': '\u00A2',
  'GBP': 'p'
};
