goog.provide('ck.data.Preferences');

goog.require('goog.json');
goog.require('goog.string');
goog.require('ck.urls.base');
goog.require('goog.net.XhrIo');

/**
 * @constructor
 */
ck.data.Preferences = function () {
  this.prefs_ = goog.global['PREFERENCES'] || {};
};
goog.addSingletonGetter(ck.data.Preferences);

/**
 * @param {string} key
 * @param {*} value
 */
ck.data.Preferences.prototype.set = function (key, value) {
  goog.net.XhrIo.send(
    goog.string.subs('%s/preferences/%s', ck.urls.Base, key),
    goog.nullFunction,
    'PUT',
    goog.json.serialize({ 'value': value }),
    { 'X-CSRFToken': goog.global['_csrf_token'] },
    15000
  );

  this.prefs_[key] = value;
};

/**
 * @param {string} key
 * @return {*}
 */
ck.data.Preferences.prototype.get = function (key) {
  return this.prefs_[key];
};

/**
 * @param {string} key
 * @param {string} subkey
 * @return {*}
 */
ck.data.Preferences.prototype.getSubValue = function (key, subkey) {
  if (this.prefs_[key]) {
    return this.prefs_[key][subkey];
  }
};

/**
 * @private
 * @type {Object.<string, *>}
 */
ck.data.Preferences.prototype.prefs_ = {};
