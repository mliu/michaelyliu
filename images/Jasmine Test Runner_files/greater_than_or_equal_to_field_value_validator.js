goog.provide('ck.validators.GreaterThanOrEqualToFieldValueValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @param {string} fieldName
 * @param {string} otherFieldName
 * @param {string} otherFieldId
 * @implements {ck.validators.Validator}
 */
ck.validators.GreaterThanOrEqualToFieldValueValidator = ck.validators.wrapKoValidator(
  function (fieldName, otherFieldName, otherFieldId) {
    return ko.validators['greaterThanOrEqualToFieldValueValidator'](
      otherFieldId,
      goog.getMsg(
        gettext('{$field} must be greater than or equal to {$otherField}.'),
        { 'field': fieldName, 'otherField': otherFieldName }
      )
    );
  }
);

