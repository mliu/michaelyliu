goog.provide('ck.Notification_Server');
goog.provide('ck.Notification_Server.Message_Event');

goog.require('ck.timeline');
goog.require('ck.urls.socket_io');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.json');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ck.Notification_Server = function () {
  goog.events.EventTarget.call(this);
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.queuedMessages_ = [];
  this.socket_ = {socket: null};
  this.registerDisposable(this.eventHandler_);

  // Not all pages have socket.io: e.g. login page, feedback page.  Certain
  // common infrastructure assumes that socket.io exists, e.g. Logger, Stats.
  // In these cases we allow the notification server to be instantiated but
  // it will not be functional.
  if (goog.isArray(goog.global['SOCKET_IO_CONNECTIONS'])) {
    this.connections_ = goog.global['SOCKET_IO_CONNECTIONS'];
    this.current_connection_index_ = Math.floor(Math.random() * this.connections_.length);
    this.set_next_connection_uri_();

    this.protocol_ = goog.global['SOCKET_IO_USE_SSL'] ? ck.Notification_Server.Protocol.HTTPS : ck.Notification_Server.Protocol.HTTP;
  }
};
goog.inherits(ck.Notification_Server, goog.events.EventTarget);
goog.addSingletonGetter(ck.Notification_Server);

/**
 * Protocol Types
 * @enum {string}
 */
ck.Notification_Server.Protocol = {
  HTTP: 'http',
  HTTPS: 'https'
};

/**
 * Socket.IO Events
 * @enum {string}
 * @const
 */
ck.Notification_Server.Event = {
  CONNECT: 'connect',
  RECONNECT: 'reconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  DISCONNECT: 'disconnect'
};

/**
 * @private
 */
ck.Notification_Server.prototype.set_next_connection_uri_ = function () {
  var connection;

  connection = this.connections_[this.current_connection_index_++ % this.connections_.length];
  this.connection_uri_ = new goog.Uri();
  this.connection_uri_.setScheme(this.protocol_);
  this.connection_uri_.setDomain(connection[0]);
  this.connection_uri_.setPort(connection[1]);
};

/**
 * set up and insert the socket.io script tag
 */
ck.Notification_Server.prototype.start = function () {
  this.set_next_connection_uri_();

  if (goog.global['JAVASCRIPT_DEBUG']) {
    goog.global['console']['log']('socket.io: connecting to', this.connection_uri_.toString());
  }

  this.add_script_();
  ck.timeline.recordMessage('started notification server');
};

/**
 * @private
 * removes existing socket.io.js script tag and inserts one from the current host:port
 */
ck.Notification_Server.prototype.add_script_ = function () {

  var script;

  script = goog.dom.getElement('socket-io-script');
  if (script !== null) {
    goog.dom.removeNode(script);
  }

  this.connection_uri_.setPath('socket.io/socket.io.js');
  script = goog.dom.createDom('script', {
      'src': this.connection_uri_.toString(),
      'type': 'text/javascript',
      'id': 'socket-io-script'
    });

  this.eventHandler_.listen(script, goog.events.EventType.LOAD, this.handle_script_load_);
  this.eventHandler_.listen(script, goog.events.EventType.ERROR, function (e) {
    // TODO: implement retries once we understand how frequently this happens
    ck.timeline.recordMessage('failed to load socket.io script');
  });

  goog.dom.appendChild(goog.dom.getElementsByTagNameAndClass('body', '')[0], script);
};


/**
 * @private
 * callback for the socket.io.js script load that sets up the actual socket.io connection
 */
ck.Notification_Server.prototype.handle_script_load_ = function () {

  ck.timeline.recordMessage('loaded socket.io script');

  this.connection_uri_.setPath('');
  this.socket_ = goog.global['io']['connect'](
    this.connection_uri_.toString(), {
      'reconnect': true
    });

  this.socket_['on'](
    ck.Notification_Server.Event.CONNECT,
    goog.bind(this.handle_connect_, this));
  this.socket_['on'](
    ck.Notification_Server.Event.MESSAGE,
    goog.bind(this.handle_message_, this));
  this.socket_['on'](
    ck.Notification_Server.Event.ERROR,
    goog.bind(this.handle_disconnect_, this));
};

/**
 * @private
 */
ck.Notification_Server.prototype.logTimeline_ = function () {
  ck.Logger.getInstance().info('timeline', ck.timeline.getString());
  ck.Logger.getInstance().info(
    'timeline',
    goog.string.subs('initialization took %s seconds',
                     ck.timeline.getDuration())
  );
};

/**
 * @private
 */
ck.Notification_Server.prototype.handle_connect_ = function () {

  if (goog.global['JAVASCRIPT_DEBUG']) {
    goog.global['console']['log']('socket.io: connection Successful to', this.connection_uri_.toString());
  }

  ck.timeline.recordMessage('connected to socket.io server');
  this.logTimeline_();
};

/**
 * @private
 */
ck.Notification_Server.prototype.handle_disconnect_ = function () {

  if (goog.global['JAVASCRIPT_DEBUG']) {
    goog.global['console']['log']('socket.io: connection failed to', this.connection_uri_.toString());
  }
  this.socket_['socket']['reconnect']();
};

/**
 * @private
 * @param {Object|string} message
 */
ck.Notification_Server.prototype.handle_message_ = function (message) {

  var message_event;

  if (goog.isString(message)) {
    message = goog.json.parse(/** @type {string} */ (message));
  }

  if (goog.global['JAVASCRIPT_DEBUG']) {
    goog.global['console']['log'](message);
  }
  message_event = new ck.Notification_Server.Message_Event(
    message['topic'],
    message,
    this);
  this.dispatchEvent(message_event);
};

ck.Notification_Server.prototype.stop = function() {
  if (!this.socket_['disconnect']) {
    return;
  }
  this.socket_['disconnect']();
};

/**
 * @param {string} topic
 * @param {Object} data
 */
ck.Notification_Server.prototype.send = function(topic, data) {
  this.queueMessage_(topic, data);
  this.sendMessages_();
};

/**
 * @private
 * @param {string} topic
 * @param {Object} data
 */
ck.Notification_Server.prototype.queueMessage_ = function (topic, data) {
  this.queuedMessages_.push({
    topic: topic,
    data: data
  });
};

/** @private */
ck.Notification_Server.prototype.sendMessages_ = function () {
  if (!this.socket_['emit']) {
    return;
  }

  goog.array.forEach(this.queuedMessages_, function (message) {
    this.socket_['emit'](message.topic, message.data);
  }, this);
  goog.array.clear(this.queuedMessages_);
};

/**
 * @private
 * @type {?Array}
 */
ck.Notification_Server.prototype.connections_ = null;

/**
 * @private
 * @type {?number}
 */
ck.Notification_Server.prototype.current_connection_index_ = null;

/**
 * @private
 * @type {goog.Uri}
 */
ck.Notification_Server.prototype.connection_uri_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.Notification_Server.prototype.eventHandler_ = null;

/**
 * @private
 * @type {Array}
 */
ck.Notification_Server.prototype.queuedMessages_ = null;

/**
 * @private
 * @type {string}
 */
ck.Notification_Server.prototype.protocol_ = ck.Notification_Server.Protocol.HTTPS;

/**
 * @type {?Object}
 * @private
 */
ck.Notification_Server.prototype.socket_ = null;

/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} topic
 * @param {Object} message
 * @param {Object} target
 */
ck.Notification_Server.Message_Event = function (topic, message, target) {
  goog.base(this, topic, target);
  this.message_ = message;
};
goog.inherits(ck.Notification_Server.Message_Event, goog.events.Event);

/**
 * @return {Object}
 */
ck.Notification_Server.Message_Event.prototype.get_message = function() {
  return this.message_;
};

/**
 * @type {Object}
 * @private
 */
ck.Notification_Server.Message_Event.prototype.message_ = null;
