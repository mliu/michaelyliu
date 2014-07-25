goog.provide('ck.validators.wrapKoValidator');

goog.require('ck.validators.ValidationResult');

ck.validators.wrapKoValidator = function (validatorFactory) {
  /**
   * @constructor
   * @implements {ck.validators.Validator}
   */
  var ValidatorClass = function () {
    this.constructorArgs_ = arguments;
  };

  ValidatorClass.prototype.validate = function (value) {
    var result;
    result = validatorFactory.apply(ko.validators, this.constructorArgs_).validate(value);
    return new ck.validators.ValidationResult(result.isValid, result.message);
  };

  ValidatorClass.factory = validatorFactory;

  return ValidatorClass;
};
