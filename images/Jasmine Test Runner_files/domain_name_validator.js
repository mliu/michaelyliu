goog.provide('ck.validators.DomainNameValidator');

goog.require('ck.validators.wrapKoValidator');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {string} message
 */
ck.validators.DomainNameValidator = ck.validators.wrapKoValidator(function (message) {
  return ko.validators['customValidator'](function (value) {
    var regexp;

    regexp = ck.validators.DomainNameValidator.DOM_NAME_RE;

    if (value.length < 256 && regexp.test(value)) {
      return ko.validators.results.valid();
    }

    return ko.validators.results.invalid(message);
  });
});

/**
 * Derived from DNAAS regexp -- https://github.rackspace.com/cloud-dns/dns-shared/blob/master/dns-domain/src/main/java/com/rackspace/cloud/dns/common/validator/DomainValidator.java
 * Modified to add support for leading underscores.
 */
ck.validators.DomainNameValidator.DOM_NAME =
  "[a-zA-Z0-9\\_][a-zA-Z0-9-\\_]*(\\.[a-zA-Z0-9\\_][a-zA-Z0-9-\\_]*)*\\.[a-zA-Z0-9]{2,}";

ck.validators.DomainNameValidator.DOM_NAME_RE = new RegExp(
  "^" + ck.validators.DomainNameValidator.DOM_NAME + "$"
);

