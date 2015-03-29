goog.provide('ck.validators.InvalidCharsValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @fileoverview
 * Validates that input does not have any of the specified invalid characters.
 */

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 * @param {Array.<string>} invalidChars
 * @param {string=} opt_customMessage
 */
ck.validators.InvalidCharsValidator = ck.validators.wrapKoValidator(function (fieldName, invalidChars, opt_customMessage) {
  return ko.validators['invalidCharsValidator'](
    invalidChars,
    opt_customMessage || goog.string.subs(
      gettext('%s cannot contain any of the characters: %s.'),
      fieldName,
      invalidChars.join('')
    )
  );
});

