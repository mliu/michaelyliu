goog.provide('ck.validators.IpAddressValidator');

goog.require('ck.validators.wrapKoValidator');
goog.require('goog.net.IpAddress');

/**
 * @constructor
 * @implements {ck.validators.Validator}
 * @param {number=} opt_version
 * @param {string=} opt_message
 */
ck.validators.IpAddressValidator = ck.validators.wrapKoValidator(function (opt_version, opt_message) {
  return ko.validators['customValidator'](function (value) {
    var ip, message;

    message = opt_message || gettext('Invalid IP address');

    ip = goog.net.IpAddress.fromString(/** @type {string} */(value));

    if (!goog.isDefAndNotNull(ip)) {
      return ko.validators.results.invalid(message);
    }

    if(goog.isDefAndNotNull(opt_version) && ip.getVersion() !== opt_version) {
      message = goog.getMsg(
        gettext('Invalid IPv{$version} address'), { 'version': opt_version }
      );
      return ko.validators.results.invalid(message);
    }

    return ko.validators.results.valid();
  });
});

/**
 * @enum {number}
 */
ck.validators.IpAddressValidator.versions = {
  V4: 4,
  V6: 6
};

