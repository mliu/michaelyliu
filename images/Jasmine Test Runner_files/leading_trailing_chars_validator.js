goog.provide('ck.validators.LeadingTrailingCharsValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @param {string} fieldName
 * @param {Array.<string>} restrictedCharacters
 * @param {string=} opt_message
 * @implements {ck.validators.Validator}
 */
ck.validators.LeadingTrailingCharsValidator = ck.validators.wrapKoValidator(function (fieldName, restrictedCharacters, opt_message) {
  var defaultMessage, message;

  defaultMessage = goog.getMsg(
    '{$field} cannot start or end with: {$restrictedChars}',
    {
      'field': fieldName,
      'restrictedChars': goog.array.map(restrictedCharacters, function (currentChar) {
        return currentChar.replace(/\\/g, '');
      }).join(' ')
    }
  );
  message = (opt_message || defaultMessage);

  return {
    validate: function (value) {
        var hasLeading, hasTrailing, regexp;

        hasLeading = goog.array.some(restrictedCharacters, function (currentChar) {
          regexp = new RegExp('^' + currentChar + '+.*$', 'g');
          return value.match(regexp);
        });

        hasTrailing = goog.array.some(restrictedCharacters, function (currentChar) {
          regexp = new RegExp('.*' + currentChar + '+$', 'g');
          return value.match(regexp);
        });

        if (hasTrailing || hasLeading) {
          return ko.validators.results.invalid(message);
        }

        return ko.validators.results.valid();
    }
  };
});
