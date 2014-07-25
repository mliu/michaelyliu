goog.provide('ck.validators.RequiredValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} fieldName
 * @param {string=} opt_customMessage
 */
ck.validators.RequiredValidator = ck.validators.wrapKoValidator(function (fieldName, opt_customMessage) {
  return ko.validators['requiredValidator'](
    opt_customMessage || goog.string.subs('%s is required.', fieldName)
  );
});
