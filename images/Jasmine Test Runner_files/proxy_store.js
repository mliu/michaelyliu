goog.provide('ck.data.ProxyStore');
goog.provide('ck.data.ProxyStore.HttpMethods');

goog.require('goog.array');
goog.require('goog.Uri.QueryData');
goog.require('goog.net.HttpStatus');
goog.require('goog.net.XhrIo');
goog.require('goog.net.ErrorCode');
goog.require('servo.Store');
goog.require('ck.urls.base');
goog.require('ck.logout');
goog.require('ck.Logger');
goog.require('ck.utility.PageUnloading');
goog.require('ck.utility.object');
goog.require('goog.events.EventHandler');

/**
 * @constructor
 * @param {ck.StatsClient=} opt_statsClient
 * @extends {servo.Store}
 */
ck.data.ProxyStore = function (opt_statsClient) {
  goog.base(this);

  this.statsClient_ = opt_statsClient || new ck.StatsClient();
  this.aggregatedParsedData_ = {};
  this.handler_ = new goog.events.EventHandler(this);
};
goog.inherits(ck.data.ProxyStore, servo.Store);

/**
 * @const
 * @enum {string}
 */
ck.data.ProxyStore.HttpMethods = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
  HEAD: 'HEAD'
};

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.data.ProxyStore.prototype.handler_ = null;

/**
 * @private
 * @type {?string}
 */
ck.data.ProxyStore.prototype.providerId_ = null;

/**
 * @private
 * @type {ck.StatsClient}
 */
ck.data.ProxyStore.prototype.statsClient_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.data.ProxyStore.prototype.enableFetchAllPages_ = false;

/**
 * @protected
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.shouldFetchAllPages = function () {
  return this.enableFetchAllPages_;
};

/**
 * Requests all data from a paginated resource before firing SYNC.  If any of
 * the paginated requests fail because of ERROR/TIMEOUT, no SYNC event will be
 * fired (and so no data will be returned).
 * @protected
 * @param {boolean} value
 */
ck.data.ProxyStore.prototype.setFetchAllPages = function (value) {
  this.enableFetchAllPages_ = value;
};

/**
 * @protected
 * @param {Object} data
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.shouldFetchNextPage = function (data) {
  throw 'Must override shouldFetchNextPage if fetchAllPages has been enabled.';
};

/**
 * @protected
 * @param {Object} data
 * @return {string|number}
 */
ck.data.ProxyStore.prototype.getPageMarkerFromResponseObject = function (data) {
  throw 'Must override getPageMarkerFromResponseObject if fetchAllPages has been enabled.';
};

/**
 * @protected
 * @return {ck.StatsClient}
 */
ck.data.ProxyStore.prototype.getStatsClient = function () {
  return this.statsClient_;
};

/**
 * @return {goog.events.EventHandler}
 */
ck.data.ProxyStore.prototype.getHandler = function () {
  return this.handler_;
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.disposeInternal = function () {
  goog.base(this, 'disposeInternal');
  this.handler_.dispose();
  this.handler_ = null;
};

/**
 * @param {string} providerId
 */
ck.data.ProxyStore.prototype.setProviderId = function (providerId) {
  this.providerId_ = providerId;
};

/**
 * @returns {!string}
 */
ck.data.ProxyStore.prototype.getProviderId = function () {
  return /** @type {!string} */ (this.providerId_);
};

/**
 * @return {string}
 */
ck.data.ProxyStore.prototype.getUrl = function () {
  return goog.string.subs('/proxy/%s', this.providerId_);
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.save = function (data) {
  var method;

  this.verifyProvider_();
  method = this.getMethodForSaveRequest(data);

  if (goog.object.containsKey(data, 'providerId')) {
    delete data['providerId'];
  }
  if (goog.object.containsKey(data, 'internalId')) {
    delete data['internalId'];
  }

  this.sendRequest(
    this.getUrlForRequest_(data),
    this.handleSendResponse_,
    method,
    this.getContentForRequest_(data)
  );
};

/**
 * Allow subclasses to override which method is used for a save request.
 * @protected
 */
ck.data.ProxyStore.prototype.getMethodForSaveRequest = function (data) {
  if (data.id) {
    return ck.data.ProxyStore.HttpMethods.PUT;
  }

  return ck.data.ProxyStore.HttpMethods.POST;
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.destroy = function (id) {
  this.verifyProvider_();
  this.sendRequest(
    this.getUrlForRequest_({ 'id': id }),
    this.handleSendResponse_,
    ck.data.ProxyStore.HttpMethods.DELETE
  );
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.fetchInternal = function (opt_args) {
  this.lastFetchArguments_ = goog.array.toArray(arguments);

  this.verifyProvider_();
  this.sendRequest(
    this.getUrlForRequestWithQueryData_(opt_args),
    this.handleSendResponse_,
    ck.data.ProxyStore.HttpMethods.GET
  );
};

/**
 * Signal that this store should attempt to use the proxy cache.
 *
 * In communication with the Twisted Proxy, this means:
 *  - requests initially ask for cached data with useProxyCache = true
 *  - responses will include the 'ETag' header in the response
 *  - ETag responses trigger a refetch without the useProxyCache argument.
 *
 * @protected
 */
ck.data.ProxyStore.prototype.useProxyCache = function () {
  this.usingProxyCache_ = true;
};

/**
 * Send an XHR to a specified the URL.
 *
 * @protected
 *
 * @param {string} uri
 * @param {function(ck.data.ProxyStore.HttpMethods, goog.events.Event)} callback
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @param {string=} opt_payload
 * @param {Object=} opt_headers
 */
ck.data.ProxyStore.prototype.sendRequest = function (uri, callback, method, opt_payload, opt_headers) {
  var headers, timeoutThreshold;

  headers = this.getRequestHeaders_(method, opt_payload, opt_headers);
  timeoutThreshold = this.getTimeoutThreshold(method);

  goog.net.XhrIo.send(
    uri,
    goog.bind(this.handleXhrSendComplete, this, callback, method),
    method,
    opt_payload,
    headers,
    timeoutThreshold
  );
};

/**
 * @protected
 * @param {function(ck.data.ProxyStore.HttpMethods, goog.events.Event)} callback
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @param {goog.events.Event} e
 */
ck.data.ProxyStore.prototype.handleXhrSendComplete = function (callback, method, e) {
  var request, wasException;

  request = /** @type {goog.net.XhrIo} */ (e.target);
  if (this.isTimeout_(request)) {
    this.dispatchEvent(servo.events.EventType.TIMEOUT);
    return;
  }

  wasException = true;
  try {
    callback.call(this, method, e);
    wasException = false;
  } finally {
    // Don't use a catch clause because that will swallow the original stack
    // trace (and re-throwing the exception will not preserve it).
    if (wasException) {
      this.dispatchEvent(new ck.data.events.RackspaceErrorEvent(this, {}));
      this.statsClient_.increment(this.getStatsId('js_exceptions'));
    }
  }
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.dispatchEvent = function (e) {
  var type, returnValue;

  this.aggregatedParsedData_ = {};

  returnValue = goog.base(this, 'dispatchEvent', e);

  type = e.type || e;
  if (type === servo.events.EventType.TIMEOUT) {
    this.getStatsClient().increment(this.getStatsId('timeouts'));
  } else if (type === servo.events.EventType.ERROR) {
    this.getStatsClient().increment(this.getStatsId('errors'));
  }

  return returnValue;
};

/**
 * @protected
 * @param {string} key
 */
ck.data.ProxyStore.prototype.getStatsId = function (key) {
  var providerStatsId;

  // Provider id will always be set -- unknown is a convenience for the tests
  providerStatsId = 'unknown';
  if (this.getProviderId()) {
    providerStatsId = this.getProviderId().replace(/,|:/g, '_');
  }

  return goog.string.buildString(
    'proxy_store.',
    providerStatsId,
    '.',
    key
  );
};

/**
 * @private
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.shouldRequestProxyCacheData_ = function () {
  return this.usingProxyCache_ && !this.proxyCacheDataRetrieved_;
};

/**
 * @protected
 */
ck.data.ProxyStore.prototype.verifyProvider_ = function () {
  if (!this.providerId_) {
    throw 'Provider ID was not set.';
  }
};

/**
 * @protected
 * @param {Object=} opt_data The model as a JavaScript object.
 * @return {string}
 */
ck.data.ProxyStore.prototype.getUrlForRequest_ = function (opt_data) {

  var baseUrl, id;

  baseUrl = this.getUrl();
  if (!opt_data || !opt_data['id']) {
    return baseUrl;
  }

  id = opt_data['id'];
  delete opt_data['id'];

  return goog.string.subs('%s/%s', baseUrl, this.escapeIdentifier_(id));
};

/**
 * Escape an identifier for use in a URL.
 * @private
 * @param {string} id
 * @return {string}
 */
ck.data.ProxyStore.prototype.escapeIdentifier_ = function (id) {
  var escapedId;

  escapedId = encodeURIComponent(id);
  // Un-escape any forward slashes (used by Cloud Files for psuedo-hierarchal
  // folders)
  escapedId = escapedId.replace(/%2F/g, '/');

  return escapedId;
};

/**
 * @protected
 * @param {Object=} opt_args Query Data to use in fetching the URL.
 * @return {string}
 */
ck.data.ProxyStore.prototype.getUrlForRequestWithQueryData_ = function (opt_args) {
  var baseUrl;

  if (this.shouldRequestProxyCacheData_()) {
    opt_args = goog.object.clone(opt_args || {});
    opt_args['useProxyCache'] = true;
  }

  baseUrl = this.getUrlForRequest_(opt_args);
  if (!opt_args || goog.object.isEmpty(opt_args)) {
    return baseUrl;
  }

  return goog.string.subs(this.getPatternForRequestWithQueryData_(), baseUrl, this.formatQueryData(opt_args));
};

/**
 * @protected
 * @return {string}
 */
ck.data.ProxyStore.prototype.formatQueryData = function (opt_args) {
  var queryData;

  queryData = new goog.Uri.QueryData();
  queryData.extend(opt_args);

  return queryData.toString();
};

/**
 * @protected
 * @return {string}
 */
ck.data.ProxyStore.prototype.getPatternForRequestWithQueryData_ = function () {
  return '%s/?%s';
};

/**
 * @protected
 * @param {Object} data
 * @return {string}
 */
ck.data.ProxyStore.prototype.getContentForRequest_ = function (data) {

  var content, queryData;

  content = {
    'csrfmiddlewaretoken': goog.global['_csrf_token']
  };

  if (!goog.object.isEmpty(data)) {
    content['data'] = JSON.stringify(data);
  }

  queryData = new goog.Uri.QueryData();
  queryData.extend(content);
  return queryData.toString();
};

/**
 * @protected
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @param {goog.events.Event} e
 */
ck.data.ProxyStore.prototype.handleSendResponse_ = function (method, e) {
  var request, responseObject, responseValue, errorEvent, successEvent;

  request = /** @type {goog.net.XhrIo} */ (e.target);

  if (this.requestWasProbablyAbortedByClient_(request)) {
    this.handleAbortRequest_(request);
    return;
  }

  responseObject = this.getObjectFromResponse(request);
  responseValue = this.getObjectFromResponse(request) ||
    request.getResponseText();

  if (this.hasRetrievedProxyCacheData_(method, request)) {
    this.proxyCacheDataRetrieved_ = true;
    this.fetch.apply(this, this.lastFetchArguments_);
  }

  if (this.isFailedResponse_(request, method)) {
    errorEvent = this.constructErrorEvent_(
      responseValue,
      request.getStatus(),
      request.getStatusText()
    );
    this.dispatchEvent(errorEvent);
    return;
  }

  if (goog.isObject(responseObject)) {
    if (method === ck.data.ProxyStore.HttpMethods.GET &&
        this.shouldFetchAllPages()) {
      this.aggregateParsedData(responseObject);
      if (this.shouldFetchNextPage(responseObject)) {
        this.fetch({
          'marker': this.getPageMarkerFromResponseObject(responseObject)
        });
      } else {
        this.parse(this.aggregatedParsedData_);
      }
    } else {
      this.parse(responseObject);
    }
  }

  if (this.isMutatingMethod_(method)) {
    successEvent = this.constructSuccessEvent_(responseValue);
    this.dispatchEvent(successEvent);
  }
};

/**
 * @private
 * @param {Object} responseData
 */
ck.data.ProxyStore.prototype.aggregateParsedData = function (responseData) {
  this.aggregatedParsedData_ = ck.utility.object.deepMerge(
    this.aggregatedParsedData_,
    responseData
  );
};

/**
 * HTTP responses with a status code 0 indicate that the XMLHttpRequest did not
 * complete successfully.  This differs from an operation that completed with
 * a 4xx or 5xx status code that is forwarded through from the upstream server
 * to the proxy via a successfully completed XMLHttpRequest.
 * @private
 * @param {goog.net.XhrIo} request
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.requestWasProbablyAbortedByClient_ = function (request) {
  // Most of these failures are because a user clicks to another page before an
  // XMLHttpRequest has finished.  In the XMLHttpRequest standard this causes
  // the 'error' flag is set.  However the error flag might also indicate some
  // other sort of network failure.  Unfortunately we cannot determine between
  // the two and logging these as errors causes a lot of statistical noise.
  return request.getStatus() === 0 || request.getLastErrorCode() === goog.net.ErrorCode.ABORT;
};

/**
 * @protected
 * @param {goog.net.XhrIo} request
 */
ck.data.ProxyStore.prototype.handleAbortRequest_ = goog.nullFunction;

/**
 * @protected
 * @param {goog.net.XhrIo} request
 * @return {Object|undefined}
 */
ck.data.ProxyStore.prototype.getObjectFromResponse = function (request) {

  var responseText;

  responseText = request.getResponseText();
  if (!responseText) {
    return null;
  }

  try {
    return /** @type {Object} */(JSON.parse(responseText));
  } catch (err) {
    if (this.shouldLogParseFailure_(request)) {
      ck.Logger.getInstance().error(
        'proxy store',
        goog.string.subs(
          'Error parsing JSON response: uri=%s, body=%s',
          request.getLastUri(),
          responseText.substr(0,256)
        )
      );
    }
    return null;
  }
};

/**
 * @private
 * @param {goog.net.XhrIo} request
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.shouldLogParseFailure_ = function(request) {

  var contentType;

  contentType = request.getResponseHeader('Content-Type') || '';
  return goog.string.contains(contentType, 'application/json');
};

/**
 * @private
 * @param {goog.net.XhrIo} request
 */
ck.data.ProxyStore.prototype.isTimeout_ = function (request) {
  return request.getLastErrorCode() === goog.net.ErrorCode.TIMEOUT;
};

/**
 * @private
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @param {goog.net.XhrIo} request
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.hasRetrievedProxyCacheData_ = function (method, request) {
  if (method !== ck.data.ProxyStore.HttpMethods.GET) {
    return false;
  }

  return goog.isDefAndNotNull(request.getResponseHeader('ETag')) &&
    goog.string.contains(
      request.getLastUri(),
      'useProxyCache=true'
    );
};

/**
 * Subclasses should override this to fire different types of success events.
 *
 * @protected
 * @param {Object|string} response
 */
ck.data.ProxyStore.prototype.constructSuccessEvent_ = function (response) {
  return new servo.events.StoreSuccessEvent(this, response);
};

/**
 * Subclasses should override this to fire different types of error events.
 * @protected
 * @param {Object|string} response
 * @param {number} statusCode
 * @param {string} statusText
 */
ck.data.ProxyStore.prototype.constructErrorEvent_ = function (response, statusCode, statusText) {
  return new servo.events.StoreErrorEvent(this, response, statusCode, statusText);
};

/** @inheritDoc */
ck.data.ProxyStore.prototype.parseInternal = function (rawData, opt_withRemoval) {
  var id;

  if (goog.isArray(rawData)) {
    goog.array.forEach(rawData, function (item) {
      // TODO: remove provider_id when nothing depends on it

      item['provider_id'] = this.providerId_;
      item['providerId'] = this.providerId_;
    }, this);
  } else {
    // TODO: remove provider_id when nothing depends on it
    rawData['provider_id'] = this.providerId_;
    rawData['providerId'] = this.providerId_;
  }

  if (rawData && rawData.id) {
    id = rawData.id;
  }

  this.setParsedData(rawData, id, opt_withRemoval);
};

/**
 * @protected
 * @param {goog.net.XhrIo} xhrio
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.isFailedResponse_ = function (xhrio, method) {
  var status;

  status = xhrio.getStatus();

  // When IE9 receives a PUT/POST response with a 204 status code
  // and an empty response body, it mangles the response code.
  if (status === 1223) {
    return false;
  }

  return status < 200 || status >= 300;
};

/**
 * @protected
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @return {boolean}
 */
ck.data.ProxyStore.prototype.isMutatingMethod_ = function (method) {
  var HttpMethods;

  HttpMethods = ck.data.ProxyStore.HttpMethods;
  return method === HttpMethods.PUT ||
    method === HttpMethods.POST ||
    method === HttpMethods.DELETE;
};

/**
 * @protected
 * @param {goog.net.XhrIo} request
 * @return {string}
 */
ck.data.ProxyStore.prototype.getIdFromRequest = function(request) {
  var locationUri;

  locationUri = request.getResponseHeader('Location');
  return goog.string.trim(locationUri.slice(locationUri.lastIndexOf('/') + 1));
};

/**
 * @private
 *
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @param {string=} opt_payload
 * @param {Object=} opt_headers
 * @return {Object}
 */

ck.data.ProxyStore.prototype.getRequestHeaders_ = function (method, opt_payload, opt_headers) {
  var headers;

  headers = opt_headers || {};
  if (opt_payload && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json; charset=UTF-8';
  }
  if (method === ck.data.ProxyStore.HttpMethods.DELETE) {
    headers['X-CSRFToken'] = goog.global['_csrf_token'];
  }

  return headers;
};

/**
 * The number of milliseconds that an XHR from this store can take.  For most
 * stores this should default to the TIMEOUT_THRESHOLD constant.  Overriding
 * this should only be done in the case when an API has known slow requests.
 *
 * @protected
 * @param {ck.data.ProxyStore.HttpMethods} method
 * @return {number}
 */
ck.data.ProxyStore.prototype.getTimeoutThreshold = function (method) {
  return ck.data.ProxyStore.TIMEOUT_THRESHOLD;
};

/**
 * The maximum amount of time to allow an XHR from the ProxyStore to live.
 *
 * @const
 */
ck.data.ProxyStore.TIMEOUT_THRESHOLD = 15000;

/**
 * @type {boolean}
 */
ck.data.ProxyStore.prototype.usingProxyCache_ = false;

/**
 * @type {boolean}
 */
ck.data.ProxyStore.prototype.proxyCacheDataRetrieved_ = false;

/**
 * Used to retrigger fetches in certain situations, e.g. requesting data from
 * the proxy cache.
 * @type {Array.<*>}
 */
ck.data.ProxyStore.prototype.lastFetchArguments_ = null;

/**
 * Store the data fetched since the last event was fired in the case that
 * multiple pages need to be retrieved.
 * @type {Object}
 */
ck.data.ProxyStore.prototype.aggregatedParsedData_ = null;
