goog.provide('ck.validators.LengthValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 * @param {number} length
 */
ck.validators.LengthValidator = ck.validators.wrapKoValidator(function (fieldName, length) {
  return ko.validators['maxLengthValidator'](
    length,
    goog.string.subs(gettext('%s cannot be longer than %s characters.'), fieldName, length)
  );
});

