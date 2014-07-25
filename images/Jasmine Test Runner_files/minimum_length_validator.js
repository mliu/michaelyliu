goog.provide('ck.validators.MinimumLengthValidator');

goog.require('goog.string');
goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @param {string} fieldName
 * @param {number} length
 * @implements {ck.validators.Validator}
 */
ck.validators.MinimumLengthValidator = ck.validators.wrapKoValidator(function (fieldName, length) {
  return ko.validators['lengthValidator'](
    ko.func.operators['greaterThanOrEqualTo'](length),
    goog.string.subs(gettext('%s must be longer than %s characters.'), fieldName, length)
  );
});

