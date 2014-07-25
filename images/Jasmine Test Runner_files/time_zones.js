goog.provide('ck.i18n.timezones.TimeZones');

goog.require('ck.data.Preferences');
goog.require('goog.array');
goog.require('goog.i18n.TimeZone');
goog.require('goog.locale.timeZoneDetection');
goog.require('goog.structs.Map');

/** 
 * @constructor
 * @param {Array=} opt_rawTimeZoneData
 * @param {ck.data.Preferences=} opt_preferences
 * @param {Function=} opt_currentTimeZone
 * @extends {goog.structs.Map}
 */
ck.i18n.timezones.TimeZones = function (opt_rawTimeZoneData, opt_preferences, opt_currentTimeZone) {
  goog.base(this);

  goog.array.forEach(opt_rawTimeZoneData || goog.global['tz_data'] || [], function (tzData) {
    this.set(tzData['id'], goog.i18n.TimeZone.createTimeZone(tzData));
  }, this);

  this.preferences_ = opt_preferences || ck.data.Preferences.getInstance();
  this.currentTimeZone = opt_currentTimeZone || ko.observable();
  this.currentTimeZone(this.getDefaultTimeZone_());
};
goog.inherits(ck.i18n.timezones.TimeZones, goog.structs.Map);
goog.addSingletonGetter(ck.i18n.timezones.TimeZones);

/** @param {goog.i18n.TimeZone} timezone */
ck.i18n.timezones.TimeZones.prototype.setCurrentTimeZone = function (timezone) {
  this.currentTimeZone(timezone);
  this.preferences_.set('timezone', timezone.getTimeZoneData()['id']);
};

/**
 * @return {string}
 */
ck.i18n.timezones.TimeZones.prototype.getPreferredTimeZone = function () {
  return /** @type {string} */(this.preferences_.get('timezone'));
};

/**
 * @return {string}
 */
ck.i18n.timezones.TimeZones.prototype.getDetectedTimeZone = function () {
  return goog.locale.timeZoneDetection.detectTimeZone();
};

/**
 * @private
 */
ck.i18n.timezones.TimeZones.prototype.getDefaultTimeZone_ = function () {
  var timeZonePreference, timeZoneDetected;
  timeZonePreference = this.getPreferredTimeZone();
  timeZoneDetected = this.getDetectedTimeZone();
  return this.get(timeZonePreference || timeZoneDetected);
};

/**
 * @return {string}
 */
ck.i18n.timezones.TimeZones.prototype.getCurrentTimeZone = function () {
  var currentTimeZone = this.currentTimeZone();
  return currentTimeZone.getTimeZoneData()['id'];
};

/** 
 * @private
 * @type {ck.data.Preferences}
 */
ck.i18n.timezones.TimeZones.prototype.preferences_ = null;


/** 
 * @type {Function}
 */
ck.i18n.timezones.TimeZones.prototype.currentTimeZone = null;
