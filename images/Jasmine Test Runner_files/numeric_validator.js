goog.provide('ck.validators.NumericValidator');

goog.require('goog.string');
goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 */
ck.validators.NumericValidator = ck.validators.wrapKoValidator(function (fieldName) {
  return ko.validators['integerValidator'](
    goog.string.subs(gettext('%s must be a number.'), fieldName)
  );
});
