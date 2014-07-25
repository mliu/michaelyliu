goog.provide('ck.format.PriceFormatter');

goog.require('ck.UserAccount');
goog.require('goog.string.format');

/**
 * @param {number} price
 * @param {number} precision
 * @return {string}
 */
ck.format.PriceFormatter.format = function (price, precision) {
  var isUk, symbol, formatString;

  if (!price) {
    return '';
  }

  isUk = ck.UserAccount.isUk();
  symbol = isUk ? '\u00A3' : '$';

  formatString = goog.string.format('%s%0.%df', symbol, precision);
  return goog.string.format(formatString, price);
};
