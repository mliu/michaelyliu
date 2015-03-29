goog.provide('ck.PerformanceTimer');

goog.require('ck.Logger');
goog.require('ck.StatsClient');

/**
 * @constructor
 * @param {string} tag
 * @param {ck.StatsClient=} opt_statsClient
 */
ck.PerformanceTimer = function (tag, opt_statsClient) {
  this.tag_ = tag;
  this.statsClient_ = opt_statsClient || new ck.StatsClient();
};

/**
 * @private
 * @return {number}
 */
ck.PerformanceTimer.prototype.getElapsedTime_ = function () {
  return goog.now() - this.startTime_;
};

/**
 * @private
 * @return {string}
 */
ck.PerformanceTimer.prototype.getTag_ = function () {
  return this.tag_;
};

/**
 * @private
 * @type {string}
 */
ck.PerformanceTimer.prototype.tag_ = '';

/**
 * @private
 * @type {boolean}
 */
ck.PerformanceTimer.prototype.active_ = false;

/**
 * @return {boolean}
 */
ck.PerformanceTimer.prototype.isActive = function () {
  return this.active_;
};

ck.PerformanceTimer.prototype.start = function () {
  this.active_ = true;
  this.startTime_ = goog.now();
};

/**
 * @type {number}
 */
ck.PerformanceTimer.prototype.startTime_ = 0;

/**
 * @return {number}
 */
ck.PerformanceTimer.prototype.getStartTime = function () {
  return this.startTime_;
};

/**
 * @type {number}
 */
ck.PerformanceTimer.prototype.stopTime_ = 0;

/**
 * @return {number}
 */
ck.PerformanceTimer.prototype.getStopTime = function () {
  return this.stopTime_;
};

/**
 * @param {string} reason
 */
ck.PerformanceTimer.prototype.stop = function (reason) {
  var elapsedTime;

  if (!this.isActive()) {
    return;
  }

  elapsedTime = this.getElapsedTime_();

  if (elapsedTime >= ck.PerformanceTimer.Constants.MINIMUM_REPORT_THRESHOLD) {
    this.report_(elapsedTime, reason);
  }

  this.active_ = false;
};

/**
 * @private
 * @param {number} elapsedTime
 * @param {string} reason
 */
ck.PerformanceTimer.prototype.report_ = function (elapsedTime, reason) {
  var stat, globalStat;

  this.reportToNewRelic_(elapsedTime, reason);

  stat = this.getStatsTag_(reason);
  globalStat = this.getGlobalTag_(reason);
  this.statsClient_.timing(stat, elapsedTime);
  this.statsClient_.increment(stat);
  this.statsClient_.increment(globalStat);
};

/**
 * @private
 * @return {string}
 */
ck.PerformanceTimer.prototype.getStatsTag_ = function (reason) {
  return goog.string.buildString(
    this.tag_.replace(/\./g, '_'),
    '.',
    reason || ck.PerformanceTimer.Reasons.LOAD
  );
};

/**
 * @private
 * @return {string}
 */
ck.PerformanceTimer.prototype.getGlobalTag_ = function (reason) {
  return goog.string.buildString(
    'component.',
    reason || ck.PerformanceTimer.Reasons.LOAD
  );
};

/**
 * NREUM::inlineHit(request_name, queue_time, app_time, total_be_time, dom_time, fe_time)
 * @private
 * @param {number} elapsedTime
 * @param {string} reason
 */
ck.PerformanceTimer.prototype.reportToNewRelic_ = function (elapsedTime, reason) {
  try {
    goog.global['NREUM']['inlineHit'](
      this.getTag_(),
      ck.PerformanceTimer.Constants.UNKNOWN_TIME,
      ck.PerformanceTimer.Constants.UNKNOWN_TIME,
      elapsedTime,
      ck.PerformanceTimer.Constants.UNKNOWN_TIME,
      ck.PerformanceTimer.Constants.UNKNOWN_TIME
    );
  } catch (e) {
    ck.Logger.getInstance().warn(ck.PerformanceTimer.Constants.LOG_CATEGORY, ck.PerformanceTimer.Constants.METHOD_NOT_AVAILABLE_MESSAGE);
  }
};

/**
 * @private
 * @param {string} tag
 * @param {number} time
 * @param {string} reason
 * @return {string}
 */
ck.PerformanceTimer.prototype.getFormattedTimerMessage_ = function (tag, time, reason) {
  return goog.string.subs('%s took %s ms to %s', tag, time, reason);
};

/**
 * @const
 */
ck.PerformanceTimer.Constants = {
  LOG_CATEGORY: 'component timing',
  METHOD_NOT_AVAILABLE_MESSAGE: 'new relic method is not available',
  NOT_ACTIVE_MESSAGE: 'tried to stop an un-started timer',
  UNKNOWN_TIME: 0,
  MINIMUM_REPORT_THRESHOLD: 0
};

ck.PerformanceTimer.Reasons = {
  LOAD: 'load',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

/**
 * @private
 * @type {ck.StatsClient}
 */
ck.PerformanceTimer.prototype.statsClient_ = null;