goog.provide('ck.StatsClient');

goog.require('ck.Logger');
goog.require('ck.Notification_Server');

/**
 * @constructor
 * @param {ck.Notification_Server=} opt_notificationServer
 * @param {ck.Logger=} opt_logger
 */
ck.StatsClient = function (opt_notificationServer, opt_logger) {
  this.notificationServer_ = (opt_notificationServer ||
                              ck.Notification_Server.getInstance());
  this.logger_ = opt_logger || ck.Logger.getInstance();
};

/**
 * @param {string} key
 * @param {number=} opt_value
 */
ck.StatsClient.prototype.increment = function (key, opt_value) {
  var data;

  data = {
    'stat': key,
    'value': opt_value || 1
  };
  this.notificationServer_.send('stats.increment', data);
  this.logger_.debug('stats', 'stats.increment {$stat} {$value}', data);
};

/**
 * @param {string} key
 * @param {number=} opt_value
 */
ck.StatsClient.prototype.decrement = function (key, opt_value) {
  var data;

  data = {
    'stat': key,
    'value': opt_value || 1
  };
  this.notificationServer_.send('stats.decrement', data);
  this.logger_.debug('stats', 'stats.decrement {$stat} {$value}', data);
};

/**
 * @param {string} key
 * @param {number} time Time in milliseconds
 */
ck.StatsClient.prototype.timing = function (key, time) {
  var data;

  data = {
    'stat': key,
    'time': time
  };
  this.notificationServer_.send('stats.timing', data);
  this.logger_.debug('stats', 'stats.timing {$stat} {$time}', data);
};

/**
 * @private
 * @type {ck.Notification_Server}
 */
ck.StatsClient.prototype.notificationServer_ = null;