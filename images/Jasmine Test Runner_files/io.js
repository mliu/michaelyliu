goog.provide('ck.io');
goog.provide('ck.io.Dispatcher');
goog.provide('ck.io.EventType');

goog.require('goog.net.XhrIo');
goog.require('goog.string');
goog.require('goog.Uri.QueryData');
goog.require('goog.events');

/**
 * A singleton that acts as an event target, which exists so that any component
 * has the ability to listen to responses to XHRs made by other components.
 * The convenience methods use this singleton to make their requests.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ck.io.Dispatcher = function () {
  goog.events.EventTarget.call(this);
};
goog.inherits(ck.io.Dispatcher, goog.events.EventTarget);
goog.addSingletonGetter(ck.io.Dispatcher);

/**
 * @const
 */
ck.io.HttpMethods = {
  POST: 'POST',
  DELETE: 'DELETE',
  GET: 'GET',
  PUT: 'PUT',
  HEAD: 'HEAD'
};

/**
 * Send an XHR with the given parameters.
 *
 * @param {string} verb HTTP verb to use when sending requests
 * @param {!string|goog.Uri} path
 * @param {function()} callback
 * @param {?goog.Uri.QueryData|undefined} opt_data
 * @param {number=} opt_timeout Milliseconds after which an incomplete request
 *     will be aborted. Defaults to the ck.data.ProxyStore TIMEOUT_THRESHOLD
 */
ck.io.Dispatcher.prototype.send_ = function (verb, path, callback,
                                             opt_data, opt_timeout) {
  var csrfToken, windowHash, data;

  if (!opt_data) {
    data = new goog.Uri.QueryData();
  } else {
    data = opt_data;
  }

  if (this.isMutatingMethod_(verb)) {
    csrfToken = goog.object.get(goog.global, '_csrf_token', 'NO_CSRF_TOKEN');
    windowHash = goog.object.get(goog.global, 'WINDOW_HASH', null);

    data.set('csrfmiddlewaretoken', csrfToken);
    if (windowHash) {
      data.set('window_hash', windowHash);
    }
  }

  data = data.toString();

  goog.net.XhrIo.send(
    path,
    this.wrapResponseCallback_(callback),
    verb,
    data,
    undefined,
    opt_timeout || ck.data.ProxyStore.TIMEOUT_THRESHOLD
  );
};

/**
 * Wrapper for response callbacks that dispatches an event when
 * the response's status is 401; a code that we want to handle
 * uniformly across the app.
 *
 * @param origCallback {function(goog.events.Event)} Original callback given
 *     to goog.XhrIo.send
 * @return {function(goog.events.Event)}
 * @private
 */
ck.io.Dispatcher.prototype.wrapResponseCallback_ = function (origCallback) {
  return goog.bind(function(e) {
    if (e.target.getStatus() === 401) {
      this.dispatchEvent(ck.io.EventType.RESPONSE_UNAUTHORIZED);
    }
    origCallback(e);
  }, this);
};

/**
 * Helper method that determines whether the given HTTP verb is a mutator
 * method.  We can use this information to decide whether to put the
 * window_hash and the CSRF token in the body instead of in the query string.
 *
 * @param {string} method HTTP verb ("PUT", "POST", etc)
 * @return {boolean}
 * @private
 */
ck.io.Dispatcher.prototype.isMutatingMethod_ = function (method) {
  return method === ck.io.HttpMethods.PUT ||
    method === ck.io.HttpMethods.POST ||
    method === ck.io.HttpMethods.DELETE;
};

/**
 * Events that are dispatched based on the XHR's response codes.
 *
 * @enum {string}
 */
ck.io.EventType = {
  RESPONSE_UNAUTHORIZED: goog.events.getUniqueId('response-unauthorized')
};

/**
 * Abstraction for get requests.  This is a convenience method that uses a
 * singleton instance of ck.io.Dispatcher.
 * @param {!string|goog.Uri} path
 * @param {?} callback
 * @param {goog.Uri.QueryData=} opt_data
 * @param {number=} opt_timeout Milliseconds after which an incomplete request
 * will be aborted
 */
ck.io.get = function (path, callback, opt_data, opt_timeout) {
  var window_hash, dispatcher;
  window_hash = goog.object.get(goog.global, 'WINDOW_HASH');
  if (opt_data) {
    path = goog.string.buildString(
      path,
      '?',
      opt_data.toString(),
      (window_hash ? '&window_hash=' + window_hash : '')
    );
  } else {
    if (window_hash) {
      if (path.indexOf('?') === -1) {
        path += '?';
      } else {
        path += '&';
      }
      path += 'window_hash=' + window_hash;
    }
  }
  dispatcher = ck.io.Dispatcher.getInstance();
  dispatcher.send_(ck.io.HttpMethods.GET, path, callback, undefined, opt_timeout);
};

/**
 * Abstraction for puts. Adds csrf token. This is a convenience method that uses a
 * singleton instance of ck.io.Dispatcher.
 * @param {!string|goog.Uri} path
 * @param {function()} callback
 * @param {!goog.Uri.QueryData} data
 * @param {number=} opt_timeout Milliseconds after which an incomplete request
 * will be aborted
 */
ck.io.put = function (path, callback, data, opt_timeout) {
  var dispatcher = ck.io.Dispatcher.getInstance();
  dispatcher.send_(ck.io.HttpMethods.PUT, path, callback, data, opt_timeout);
};

/**
 * Abstraction for posts. Adds csrf token. This is a convenience method that uses a
 * singleton instance of ck.io.Dispatcher.
 * @param {!string|goog.Uri} path
 * @param {function()} callback
 * @param {!goog.Uri.QueryData} data
 * @param {number=} opt_timeout Milliseconds after which an incomplete request
 * will be aborted
 */
ck.io.post = function (path, callback, data, opt_timeout) {
  var dispatcher = ck.io.Dispatcher.getInstance();
  dispatcher.send_(ck.io.HttpMethods.POST, path, callback, data, opt_timeout);
};

/**
 * Abstraction for delete. Adds csrf token. This is a convenience method that uses a
 * singleton instance of ck.io.Dispatcher.
 * @param {!string|goog.Uri} path
 * @param {function()} callback
 * @param {goog.Uri.QueryData=} opt_data
 * @param {number=} opt_timeout Milliseconds after which an incomplete request
 * will be aborted
 */
ck.io.http_delete = function (path, callback, opt_data, opt_timeout) {
  var dispatcher = ck.io.Dispatcher.getInstance();
  dispatcher.send_(ck.io.HttpMethods.DELETE,
                    path,
                    callback,
                    opt_data,
                    opt_timeout);
};

/**
 * @param {!string|goog.Uri} path
 * @param {function()} callback
 * @param {number=} opt_timeout
 */
ck.io.head = function (path, callback, opt_timeout) {
  var dispatcher = ck.io.Dispatcher.getInstance();
  dispatcher.send_(ck.io.HttpMethods.HEAD, path, callback, null, opt_timeout);
};
