goog.provide('ck.Logger');

goog.require('ck.Notification_Server');
goog.require('ck.UserAccount');
goog.require('goog.array');
goog.require('goog.userAgent');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.Disposable');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');

/**
 * @constructor
 * @param {ck.Notification_Server=} opt_notificationServer
 * @extends {goog.Disposable}
 */
ck.Logger = function (opt_notificationServer) {
  var debugConsole;

  goog.base(this);

  this.notificationServer_ = opt_notificationServer || ck.Notification_Server.getInstance();
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
  this.handler_.listen(
    goog.global,
    goog.events.EventType.ERROR,
    this.onGlobalError_
  );

  if (goog.DEBUG) {
    // Too much noise on this if this runs during tests
    if (!goog.global['JAVASCRIPT_TEST_RUNNER']) {
      debugConsole = new goog.debug.Console();
      debugConsole.setCapturing(true);
      goog.array.forEach(
        goog.global['JAVASCRIPT_SUPPRESSED_LOG_CATEGORIES'],
        function (category) {
          goog.debug.Logger.getLogger(category).setLevel(goog.debug.Logger.Level.OFF);
        }
      );
    }
  }
};
goog.inherits(ck.Logger, goog.Disposable);
goog.addSingletonGetter(ck.Logger);

/**
 * @param {string} category
 * @param {string} description
 * @param {ck.LogLevel=} opt_level
 * @param {Object=} opt_data
 */
ck.Logger.prototype.log = function (category, description, opt_level, opt_data) {
  var data, el, debugLogger;

  if (goog.dom.isElement(opt_data)) {
    data = {};
    this.extendDataForElement_(data, /** @type {Element} */ (opt_data));
  } else {
    data = opt_data || {};
  }

  goog.object.extend(data, {
    'level': opt_level || ck.LogLevel.INFO,
    'category': category,
    'description': description,
    'username': ck.UserAccount.getUsername() || '',
    'accountId': ck.UserAccount.accountId() || '',
    'isUk': ck.UserAccount.isUk ? ck.UserAccount.isUk().toString() : '',
    'isManaged': ck.UserAccount.isManaged ? ck.UserAccount.isManaged().toString() : '',
    'timestamp': goog.now(),
    'location': goog.global.location.pathname,
    'locationHash': goog.global.location.hash,
    'userAgent': goog.userAgent.getUserAgentString(),
    'staticContentVersion': goog.global['STATIC_CONTENT_VERSION']
  });

  if (typeof(data.description) === 'string') {
    data.description = goog.getMsg(data.description, data);
  }

  if (data.level === ck.LogLevel.ERROR) {
    this.pushLog_([ data.level, data.category, data.description ]);
  }

  if (data.level !== ck.LogLevel.DEBUG) {
    this.notificationServer_.send(ck.Logger.TOPIC, data);
  }

  if (goog.DEBUG) {
    debugLogger = goog.debug.Logger.getLogger(data.category);
    debugLogger.log(ck.Logger.LogLevelMap[data.level], data.description);
  }
};

/**
 * @private
 * @param {Object} data
 * @param {Element} el
 */
ck.Logger.prototype.extendDataForElement_ = function (data, el) {
  var textContent;

  data.description = data.category;
  if (el.id) {
    data['id'] = el.id;
  }
  if (el.className) {
    data['class'] = el.className;
  }

  textContent = goog.dom.getTextContent(el);
  if (textContent) {
    if (textContent.length > 20) {
      data['textContent'] = goog.string.buildString(
        textContent.substr(0, 20),
        '...'
      );
    } else {
      data['textContent'] = textContent;
    }
  }
};

/**
 * @private
 * @param {Array} entry
 */
ck.Logger.prototype.pushLog_ = function (entry) {
  this.cleanUpOldLogs_();
  this.entries_.push(entry);
};

/** @private */
ck.Logger.prototype.cleanUpOldLogs_ = function () {
  this.entries_ = (this.entries_ || []).slice(-ck.Logger.MAX_LOG_ENTRIES);
};

/**
 * @public
 * @return {string}
 * */
ck.Logger.prototype.readLogs = function () {
  var entries;
  entries = this.entries_;
  this.entries_ = [];
  return JSON.stringify(entries);
};

/**
 * @public
 * @return {string}
 * */
ck.Logger.readLogs = function () {
  return ck.Logger.getInstance().readLogs();
};
goog.exportSymbol('ck.readLogs', ck.Logger.readLogs);

/**
 * @param {string} category
 * @param {string} description
 * @param {Object=} opt_data
 */
ck.Logger.prototype.info = function (category, description, opt_data) {
  this.log(category, description, ck.LogLevel.INFO, opt_data);
};

/**
 * @param {string} category
 * @param {string} description
 * @param {Object=} opt_data
 */
ck.Logger.prototype.warn = function (category, description, opt_data) {
  this.log(category, description, ck.LogLevel.WARN, opt_data);
};

/**
 * @param {string} category
 * @param {string} description
 * @param {Object=} opt_data
 */
ck.Logger.prototype.error = function (category, description, opt_data) {
  this.log(category, description, ck.LogLevel.ERROR, opt_data);
};

/**
 * @param {string} category
 * @param {string} description
 * @param {Object=} opt_data
 */
ck.Logger.prototype.debug = function (category, description, opt_data) {
  this.log(category, description, ck.LogLevel.DEBUG, opt_data);
};

/**
 * @private
 * @param {goog.events.BrowserEvent} e
 */
ck.Logger.prototype.onGlobalError_ = function (e) {
  // can't use StatsClient here because it causes a circular goog.require
  // dependency
  this.notificationServer_.send('stats.increment', {
    'stat': 'js_exceptions'
  });

  this.error('exception', e.getBrowserEvent()['message']);
};

/**
 * @private
 * @type {ck.Notification_Server}
 */
ck.Logger.prototype.notificationServer_ = null;

/**
 * The topic listened to by the socket.io server for logging messages
 * @type {string}
 */
ck.Logger.TOPIC = 'logging';

/** @const */
ck.Logger.MAX_LOG_ENTRIES = 100;

/**
 * @const
 * @enum {string}
 */
ck.LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * @const
 * @type {Object.<ck.LogLevel, goog.debug.Logger.Level>}
 */
ck.Logger.LogLevelMap = goog.object.create(
  ck.LogLevel.DEBUG, goog.debug.Logger.Level.INFO,
  ck.LogLevel.INFO, goog.debug.Logger.Level.INFO,
  ck.LogLevel.WARN, goog.debug.Logger.Level.WARNING,
  ck.LogLevel.ERROR, goog.debug.Logger.Level.SEVERE
);
