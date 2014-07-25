goog.provide('ck.validators.ValidationResult');

/**
 * @constructor
 * @param {boolean} isValid
 * @param {string=} opt_message
 */
ck.validators.ValidationResult = function(isValid, opt_message) {
  this.isValid_ = isValid;
  this.message_ = opt_message || '';
};

/**
 * @private
 * @type {boolean}
 */
ck.validators.ValidationResult.prototype.isValid_ = true;

/**
 * @private
 * @type {string}
 */
ck.validators.ValidationResult.prototype.message_ = '';

/**
 * @return {boolean}
 */
ck.validators.ValidationResult.prototype.isValid = function() {
  return this.isValid_;
};

/**
 * @return {string}
 */
ck.validators.ValidationResult.prototype.getMessage = function() {
  return this.message_;
};

/**
 * @param {string} message
 */
ck.validators.ValidationResult.prototype.setMessage = function (message) {
  this.message_ = message;
};

goog.exportProperty(
  ck.validators.ValidationResult.prototype,
  'isValid',
  ck.validators.ValidationResult.prototype.isValid
);
goog.exportProperty(
  ck.validators.ValidationResult.prototype,
  'getMessage',
  ck.validators.ValidationResult.prototype.getMessage
);
