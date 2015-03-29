goog.provide('ck.validators.GreaterThanValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 * @param {number} min
 */
ck.validators.GreaterThanValidator = ck.validators.wrapKoValidator(function (fieldName, min) {
  return ko.validators['integerValueValidator'](
    ko.func.operators['greaterThan'](min),
    goog.string.subs(gettext('%s must be greater than %s.'), fieldName, min)
  );
});

