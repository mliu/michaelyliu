goog.provide('servo.JsonStore');

goog.require('goog.events.Event');
goog.require('goog.net.XhrManager');
goog.require('goog.net.XhrManager.Request');
goog.require('goog.Uri.QueryData');
goog.require('goog.string');

goog.require('servo.events.StoreSyncedEvent');
goog.require('servo.events.EventType');
goog.require('servo.Store');


/**
 * This class is a general XHR+JSON store that can be extended and used
 * for both models and collections. The JsonStore does not yet support
 * servo.Dictionary properties.
 * @constructor
 * @extends {servo.Store}
 */
servo.JsonStore = function () {
  goog.base(this);
  this.activeXhrIds_ = [];
};
goog.inherits(servo.JsonStore, servo.Store);

/**
 * @type {Object.<string>}
 */
servo.JsonStore.HttpMethods = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE'
};

/**
 * Url Attributes
 * @enum {string}
 */
servo.JsonStore.UrlAttributes = {
  ID: ':id'
};

/**
 * @type {goog.net.XhrManager.Request}
 * @private
 */
servo.JsonStore.prototype.lastRequest_ = null;

/**
 * @type {number}
 * @private
 */
servo.JsonStore.prototype.xhrId_ = 0;

/**
 * @type {number}
 * @private
 */
servo.JsonStore.prototype.maxRetries_ = 1;

/**
 * @type {Array.<string>}
 * @private
 */
servo.JsonStore.prototype.activeXhrIds_ = null;


/**
 * @type {goog.net.XhrManager}
 * @private
 */
servo.JsonStore.prototype.xhrManager_ = null;

/**
 * The URL the store will make requests on.
 * @type {?string}
 * @private
 */
servo.JsonStore.prototype.url_ = null;

/**
 * @type {number}
 * @private
 */
servo.JsonStore.prototype.timeout_ = 60000;

/**
 * @type {?string}
 * @private
 */
servo.JsonStore.prototype.csrfToken_ = null;

/**
 * @type {?string}
 * @private
 */
servo.JsonStore.prototype.csrfTokenKeyName_ = null;

/** @inheritDoc */
servo.JsonStore.prototype.save = function (data) {
  var dataObj, id;
  if (data.id !== undefined) {
    id = data.id;
    delete data.id;
  }
  dataObj = new goog.Uri.QueryData();
  dataObj.extend(data);
  if (id !== undefined) {
    this.send_(dataObj, servo.JsonStore.HttpMethods.PUT, id);
  } else {
    this.send_(dataObj, servo.JsonStore.HttpMethods.POST);
  }
};

/** @inheritDoc */
servo.JsonStore.prototype.fetchInternal = function (opt_args) {
  var data, id;
  data = new goog.Uri.QueryData();
  if (opt_args) {
    if (opt_args.id !== undefined) {
      id = opt_args.id;
      delete opt_args.id;
    }
    data.extend(opt_args);
  }
  this.send_(data, servo.JsonStore.HttpMethods.GET, id);
};

/** @inheritDoc */
servo.JsonStore.prototype.destroy = function (opt_args) {
  var id;

  id = /** @type {string|number} */ (opt_args);
  this.send_(new goog.Uri.QueryData(), servo.JsonStore.HttpMethods.DELETE, id);
};

/**
 * @param {string} csrfToken A CSRF token.
 * @param {string} tokenName The variable name for the CSRF token.
 */
servo.JsonStore.prototype.setCsrfToken = function (csrfToken, tokenName) {
  this.csrfToken_ = csrfToken;
  this.csrfTokenKeyName_ = tokenName;
};

/**
 * @param {number} maxRetries The maximum number of retries.
 */
servo.JsonStore.prototype.setMaxRetries = function (maxRetries) {
  this.maxRetries_ = maxRetries;
};

/**
 * @param {!goog.Uri.QueryData} data
 * @param {string} method
 * @param {string|number=} opt_id
 * @protected
 */
servo.JsonStore.prototype.send_ = function (data, method, opt_id) {
  var internalXhrManager, url, newXhrId;

  if (this.csrfToken_ && this.csrfTokenKeyName_ &&
      method !== servo.JsonStore.HttpMethods.GET) {
    data.set(this.csrfTokenKeyName_, this.csrfToken_);
  }
  if (!this.xhrManager_) {
    internalXhrManager = new goog.net.XhrManager();
    this.registerDisposable(internalXhrManager);
    this.xhrManager_ = internalXhrManager;
  }
  if(goog.isNull(this.url_)) {
    return;
  }
  if(goog.isDefAndNotNull(opt_id) &&
      goog.string.contains(this.url_, servo.JsonStore.UrlAttributes.ID)) {
      url = goog.string.buildString(
        this.url_.replace(servo.JsonStore.UrlAttributes.ID, String(opt_id)),
        '/');
  } else {
    url = goog.string.buildString(this.url_, '/', opt_id);
  }
  if (method === servo.JsonStore.HttpMethods.GET) {
    url = goog.string.buildString(url, '?', data.toString());
  }

  newXhrId = (++this.xhrId_).toString();

  this.lastRequest_ = this.xhrManager_.send(
    newXhrId,
    url,
    method,
    method !== servo.JsonStore.HttpMethods.GET ? data.toString() : undefined,
    undefined,
    undefined,
    goog.bind(this.handleSendResponse_, this, newXhrId, method),
    this.maxRetries_
  );
  this.activeXhrIds_.push(newXhrId);
};

/**
 * @param {string} xhrId
 * @param {string} method
 * @param {!goog.events.Event} event
 * @private
 */
servo.JsonStore.prototype.handleSendResponse_ = function (xhrId, method, event) {
  var status;
  goog.array.remove(this.activeXhrIds_, xhrId);
  status = event.target.getStatus();
  if (status >= 200 && status < 300) {
    this.handleSuccessfulResponseInternal(method, event);
  } else {
    this.handleErrorResponseInternal(method, event);
  }
};

/**
 * @protected
 * @param {string} method
 * @param {!goog.events.Event} e
 */
servo.JsonStore.prototype.handleSuccessfulResponseInternal =
  function (method, e) {
  var response;
  if (method === servo.JsonStore.HttpMethods.DELETE) {
    this.dispatchEvent(servo.events.EventType.DELETE);
  } else {
    response = e.target.getResponseJson();
    this.parse(response);
  }
};

/**
 * @protected
 * @param {string} method
 * @param {!goog.events.Event} e
 */
servo.JsonStore.prototype.handleErrorResponseInternal = goog.nullFunction;

/**
 * @public
 */
servo.JsonStore.prototype.abort = function () {
  goog.array.forEach(this.activeXhrIds_,
    function (xhrId) {
      this.xhrManager_.abort(xhrId, true);
    }, this);
  this.activeXhrIds_ = [];
};

/**
 * @return {Array.<string>}
 */
servo.JsonStore.prototype.getActiveRequestIds = function () {
  return this.activeXhrIds_;
};

/** @inheritDoc */
servo.JsonStore.prototype.parseInternal = function (opt_rawData) {
  var id;
  if (opt_rawData && opt_rawData.id) {
    id = opt_rawData.id;
    delete opt_rawData.id;
  }
  this.setParsedData(opt_rawData, id);
};

/**
 * @param {!string} url
 */
servo.JsonStore.prototype.setUrl = function (url) {
  this.url_ = url;
};

/**
 * @return {?string}
 */
servo.JsonStore.prototype.getUrl = function () {
  return this.url_;
};

/**
 * @param {!goog.net.XhrManager} manager
 */
servo.JsonStore.prototype.setXhrManager = function (manager) {
  this.xhrManager_ = manager;
};

/**
 * @return {goog.net.XhrManager}
 */
servo.JsonStore.prototype.getXhrManager = function () {
  return this.xhrManager_;
};

/**
 * Get the last id used to send a request via the internal goog.ui.XhrManager
 * @return {number}
 */
servo.JsonStore.prototype.getLastSendId = function () {
  return this.xhrId_;
};

/**
 * Get the last request made.
 * @return {goog.net.XhrManager.Request};
 */
servo.JsonStore.prototype.getLastRequest = function () {
  return this.lastRequest_;
};
