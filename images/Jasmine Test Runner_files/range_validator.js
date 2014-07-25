goog.provide('ck.validators.RangeValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 * @param {number} min
 * @param {number} max
 * @param {string=} opt_customMessage
 */
ck.validators.RangeValidator = ck.validators.wrapKoValidator(function (fieldName, min, max, opt_customMessage) {
  var message;
  message = opt_customMessage;

  if (!message) {
    message = (min === max) ?
      goog.string.subs(gettext('%s must be %s.'), fieldName, min) :
      goog.string.subs(gettext('%s must be between %s and %s.'), fieldName, min, max);
  }

  return ko.validators['rangeValidator'](min, max, message);
});
