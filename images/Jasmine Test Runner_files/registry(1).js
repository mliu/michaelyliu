goog.provide('ck.validators.registry');

goog.require('ck.validators.DomainNameValidator');
goog.require('ck.validators.GreaterThanOrEqualToFieldValueValidator');
goog.require('ck.validators.GreaterThanValidator');
goog.require('ck.validators.InvalidCharsValidator');
goog.require('ck.validators.IpAddressValidator');
goog.require('ck.validators.LengthValidator');
goog.require('ck.validators.LessThanOrEqualToFieldValueValidator');
goog.require('ck.validators.MinimumLengthValidator');
goog.require('ck.validators.NumericValidator');
goog.require('ck.validators.RangeValidator');
goog.require('ck.validators.RegexMatchValidator');
goog.require('ck.validators.RequiredValidator');
goog.require('ck.validators.LeadingTrailingCharsValidator');

(function () {
  ko.validation.registerValidator('required', ck.validators.RequiredValidator.factory);
  ko.validation.registerValidator('length', ck.validators.LengthValidator.factory);
  ko.validation.registerValidator('minLength', ck.validators.MinimumLengthValidator.factory);

  ko.validation.registerValidator('integer', ck.validators.NumericValidator.factory);
  ko.validation.registerValidator('range', ck.validators.RangeValidator.factory);

  ko.validation.registerValidator('regex', ck.validators.RegexMatchValidator.factory);
  ko.validation.registerValidator('invalidChars', ck.validators.InvalidCharsValidator.factory);
  ko.validation.registerValidator('invalidLeadingTrailingChars', ck.validators.LeadingTrailingCharsValidator.factory);

  ko.validation.registerValidator('equalToFieldValue', function (fieldName, otherFieldName, otherFieldId) {
    return ko.validators['equalToFieldValueValidator'](
      otherFieldId,
      goog.getMsg(
        gettext('{$field} must be equal to {$otherField}.'),
        { 'field': fieldName, 'otherField': otherFieldName }
      )
    );
  });

  ko.validation.registerValidator('greaterThanOrEqual', function (fieldName, value) {
    return ko.validators['integerValueValidator'](
      ko.func.operators['greaterThanOrEqualTo'](value),
      goog.getMsg(
        gettext('{$field} must be greater than or equal to {$value}.'),
        { 'field': fieldName, 'value': value }
      )
    );
  });

  ko.validation.registerValidator('greaterThanOrEqualToFieldValue', ck.validators.GreaterThanOrEqualToFieldValueValidator.factory);
  ko.validation.registerValidator('lessThanOrEqualToFieldValue', ck.validators.LessThanOrEqualToFieldValueValidator.factory);
  ko.validation.registerValidator('greaterThan', ck.validators.GreaterThanValidator.factory);
  ko.validation.registerValidator('ipAddress', ck.validators.IpAddressValidator.factory);
  ko.validation.registerValidator('domainName', ck.validators.DomainNameValidator.factory);
})();
