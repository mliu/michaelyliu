goog.provide('ck.widgets.popovers.Command');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('servo.events.EventType');
goog.require('ck.data.service.ServiceRegistry');

/**
 * TODO: this should be in the ck.commands namespace.
 * @constructor
 * @param {Object=} opt_model
 * @extends {goog.events.EventTarget}
 */
ck.widgets.popovers.Command = function (opt_model) {
  goog.base(this);
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
  if (opt_model) {
    this.setModel(opt_model);
  }
};
goog.inherits(ck.widgets.popovers.Command, goog.events.EventTarget);

/**
 * @protected
 * @type {Object}
 */
ck.widgets.popovers.Command.prototype.model_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.widgets.popovers.Command.prototype.handler_ = null;

/**
 * The 'target' of a popover.  Usually a servo.Model.
 * @param {Object} model
 */
ck.widgets.popovers.Command.prototype.setModel = function (model) {
  this.model_ = model;
  if (model instanceof goog.events.EventTarget) {
    this.handleEventsOn(/** @type {goog.events.EventTarget} */ (model));
  }
};

/**
 * @return {goog.events.EventHandler}
 */
ck.widgets.popovers.Command.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * @return {Object}
 */
ck.widgets.popovers.Command.prototype.getModel = function () {
  return this.model_;
};

/**
 * Used to initialize any state that is not the model.  Override in subclasses
 * to pass things like providers, associated collections, etc.
 * @param {Object} data
 */
ck.widgets.popovers.Command.prototype.setData = function (data) {};

/**
 * @protected
 * @param {servo.events.StoreSuccessEvent} e
 */
ck.widgets.popovers.Command.prototype.onSuccess_ = function (e) {
  this.dispatchEvent(ck.widgets.popovers.Command.EventType.COMPLETE);
};

/**
 * @protected
 * @param {servo.events.StoreErrorEvent} e
 */
ck.widgets.popovers.Command.prototype.onError_ = function (e) {
  this.dispatchEvent(e);
};

/**
 * @protected
 * @param {servo.events.StoreErrorEvent} e
 */
ck.widgets.popovers.Command.prototype.onTimeout_ = function (e) {
  this.dispatchEvent(e);
};

/**
 * @protected
 * @param {goog.events.EventTarget} eventTarget
 */
ck.widgets.popovers.Command.prototype.handleEventsOn = function (eventTarget) {
  this.handleSuccessFrom(eventTarget);
  this.handleErrorFrom(eventTarget);
  this.handleTimeoutFrom(eventTarget);
};

/**
 * @protected
 * @param {goog.events.EventTarget} eventTarget
 */
ck.widgets.popovers.Command.prototype.handleSuccessFrom = function (eventTarget) {
  this.getHandler().listen(
    eventTarget,
    servo.events.EventType.SUCCESS,
    this.onSuccess_);
};

/**
 * @protected
 * @param {goog.events.EventTarget} eventTarget
 */
ck.widgets.popovers.Command.prototype.handleErrorFrom = function (eventTarget) {
  this.getHandler().listen(
    eventTarget,
    servo.events.EventType.ERROR,
    this.onError_);
};

/**
 * @protected
 * @param {goog.events.EventTarget} eventTarget
 */
ck.widgets.popovers.Command.prototype.handleTimeoutFrom = function (eventTarget) {
  this.getHandler().listen(
    eventTarget,
    servo.events.EventType.TIMEOUT,
    this.onTimeout_);
};

/**
 * @protected
 * @param {goog.events.EventTarget} target
 * @param {string} type
 */
ck.widgets.popovers.Command.prototype.redispatchOnSelf = function (target, type) {
  this.getHandler().listen(target, type, function (e) {
    this.dispatchEvent(e);
  });
};

/**
 * @param {Object=} data
 */
ck.widgets.popovers.Command.prototype.execute = goog.nullFunction;

/**
 * @protected
 * @param {*} dependency
 * @param {...*} var_args
 */
ck.widgets.popovers.Command.prototype.getDependency =
  ck.data.service.ServiceRegistry.getDependencyFromSingleton;

/**
 * @protected
 * @param {ck.routing.Route} route
 * @param {...*} var_args
 */
ck.widgets.popovers.Command.prototype.navigateRoute = function (route, var_args) {

  var parameters, url;

  parameters = goog.array.toArray(arguments).slice(1);
  url = ck.routing.url_for(route, parameters);
  ck.routing.Router.getInstance().navigate(url);
};

/**
 * @protected
 * @param {Array.<servo.Model>|servo.Collection} models
 * @param {Function} callback
 */
ck.widgets.popovers.Command.prototype.concurrentlyListenAll = function (models, callback) {
  var deferreds, deferredList, listenerRegistrar;
  deferreds = [];

  listenerRegistrar = function (model) {
    var deferred = new goog.async.Deferred();
    this.getHandler().listenOnce(
      model,
      [
        servo.events.EventType.SUCCESS,
        servo.events.EventType.ERROR,
        servo.events.EventType.TIMEOUT
      ],
      function (event) {
        if (event.type === servo.events.EventType.SUCCESS) {
          deferred.callback(event);
        } else {
          deferred.errback(event);
        }
      }
    );
    deferreds.push(deferred);
  };

  if (models instanceof servo.Collection) {
    models.forEach(listenerRegistrar, this);
  } else {
    goog.array.forEach(models, listenerRegistrar, this);
  }

  callback = goog.bind(callback, this);
  deferredList = new goog.async.DeferredList(deferreds);
  deferredList.addCallback(function (events) {
    var successes, failures;

    successes = goog.array.map(
      goog.array.filter(events, function (e) { return e[0]; }),
      function (e) { return e[1]; }
    );
    failures = goog.array.map(
      goog.array.filter(events, function (e) { return !e[0]; }),
      function (e) { return e[1]; }
    );

    callback(successes, failures);
  });
};

/**
 * @const
 * @enum {string}
 */
ck.widgets.popovers.Command.EventType = {
  COMPLETE: goog.events.getUniqueId('command-complete'),
  ERROR: goog.events.getUniqueId('command-error')
};
