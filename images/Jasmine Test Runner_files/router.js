goog.provide('ck.routing.Router');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.object');
goog.require('ck.routing');
goog.require('ck.routing.Route');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('ck.Logger');
goog.require('ck.urls.Unauthorized');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {goog.History=} opt_history_manager
 */
ck.routing.Router = function(opt_history_manager) {
  goog.base(this);
  this.history_manager_ = opt_history_manager || ck.routing.history_manager;
  this.history_manager_.setEnabled(true);
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
  this.listenerForNavigation_();
  this.routes_ = [];
};
goog.inherits(ck.routing.Router, goog.events.EventTarget);
goog.addSingletonGetter(ck.routing.Router);

/**
 * @private
 * @type {goog.History}
 */
ck.routing.Router.prototype.history_manager_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.routing.Router.prototype.handler_ = null;

/**
 * @private
 * @type {Array.<ck.routing.Route>}
 */
ck.routing.Router.prototype.routes_ = null;

/**
 * @param {ck.routing.Route} route
 * @param {function(...[?])} action
 * @param {Object=} opt_context
 */
ck.routing.Router.prototype.addRoute = function (route, action, opt_context) {
  route.setAction(goog.bind(action, opt_context));
  this.routes_.push(route);
};

/**
 */
ck.routing.Router.prototype.start = function() {
  var fragment;
  fragment = goog.global['location']['hash'].replace(/^#/, '');
  this.process_fragment_(fragment);
};

/**
 * @private
 * @param {string} fragment
 * @return {ck.routing.Route}
 */
ck.routing.Router.prototype.getRouteForFragment_ = function (fragment) {
  return /** @type {ck.routing.Route}*/(goog.array.find(this.routes_, function (route) {
    return route.matches_fragment(fragment);
  }));
};

/**
 * @private
 * @param {string} fragment
 */
ck.routing.Router.prototype.process_fragment_ = function(fragment) {

  var route, parameters;

  route = this.getRouteForFragment_(fragment);

  if (!route) {
    this.dispatchEvent(ck.routing.Router.EventType.PAGE_NOT_FOUND);
    throw new Error('Fragment does not match any routes.');
  } else if (!route.isAllowed()) {
    this.dispatchEvent(ck.routing.Router.EventType.UNAUTHORIZED);
    throw new Error('Not authorized to visit this route.');
  }

  parameters = route.extract_parameters(fragment);
  goog.array.forEach(parameters, function(el, index, ar) {
    ar[index] = decodeURIComponent(ar[index]);
  });
  parameters.push(route.extract_query_data(fragment));
  route.getAction().apply(this, parameters);
};

/**
 * @param {string} fragment
 */
ck.routing.Router.prototype.navigate = function(fragment) {
  var message;

  message = goog.string.subs('navigating to %s#%s', goog.global.location.pathname, fragment);
  ck.Logger.getInstance().info('navigation', message);

  this.process_fragment_(fragment);
  this.history_manager_.setToken(fragment);
};

/**
 * @private
 * @param {goog.events.Event} e
 */
ck.routing.Router.prototype.handle_navigation_ = function(e) {
  if (!e.isNavigation) {
    return;
  }
  this.navigate(e.token);
};

/**
 * The method allows you to simply change the url token and will not worry about
 * navigation.
 * @param {string} url
 */
ck.routing.Router.prototype.setUrl = function (url) {
  this.unlistenFromNavigation_();
  this.history_manager_.replaceToken(url);
  goog.global.setTimeout(goog.bind(this.listenerForNavigation_, this), 1);
};

/**
 * @private
 */
ck.routing.Router.prototype.listenerForNavigation_ = function () {
  this.handler_.listen(
    this.history_manager_,
    goog.history.EventType.NAVIGATE,
    this.handle_navigation_,
    undefined,
    this
  );
};

/**
 * @private
 */
ck.routing.Router.prototype.unlistenFromNavigation_ = function () {
  this.handler_.removeAll();
};

/**
 * @return {goog.events.EventHandler}
 */
ck.routing.Router.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * @enum {string}
 */
ck.routing.Router.EventType = {
  PAGE_NOT_FOUND: goog.events.getUniqueId('PAGE_NOT_FOUND'),
  UNAUTHORIZED: goog.events.getUniqueId('UNAUTHORIZED')
};
