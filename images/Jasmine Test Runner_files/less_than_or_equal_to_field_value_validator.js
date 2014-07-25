goog.provide('ck.validators.LessThanOrEqualToFieldValueValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @param {string} fieldName
 * @param {string} otherFieldName
 * @param {string} otherFieldId
 * @implements {ck.validators.Validator}
 */
ck.validators.LessThanOrEqualToFieldValueValidator = ck.validators.wrapKoValidator(
  function (fieldName, otherFieldName, otherFieldId) {
    return ko.validators['lessThanOrEqualToFieldValueValidator'](
      otherFieldId,
      goog.getMsg(
        gettext('{$field} must be less than or equal to {$otherField}.'),
        { 'field': fieldName, 'otherField': otherFieldName }
      )
    );
  }
);

