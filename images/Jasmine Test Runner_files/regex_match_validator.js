goog.provide('ck.validators.RegexMatchValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @param {RegExp} regex
 * @param {string} fieldName
 * @param {string} messageFragment
 * @implements {ck.validators.Validator}
 */
ck.validators.RegexMatchValidator = ck.validators.wrapKoValidator(function (regex, fieldName, messageFragment) {
  return ko.validators['regexValidator'](
    regex,
    goog.string.subs('%s %s.', fieldName, messageFragment)
  );
});

