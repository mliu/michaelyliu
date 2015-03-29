goog.provide('ck.knockout.ViewModel');

goog.require('goog.Disposable');
goog.require('goog.events.EventHandler');
goog.require('ck.validators.registry');

/**
 * @constructor
 * @extends {goog.Disposable}
 */
ck.knockout.ViewModel = function () {
  goog.base(this);

  this.subscriptions_ = [];
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
};
goog.inherits(ck.knockout.ViewModel, goog.Disposable);

/**
 * @param {Object} viewModel
 * @return {Object}
 */
ck.knockout.ViewModel.flatten = function (viewModel) {
  var flattened;
  flattened = {};
  goog.object.forEach(viewModel, function (value, property) {
    if (ko.isObservable(value)) {
      flattened[property] = value();
    } else {
      flattened[property] = value;
    }
  });
  return flattened;
};

/**
 * @return {Object}
 */
ck.knockout.ViewModel.prototype.flatten = function () {
  return ck.knockout.ViewModel.flatten(this);
};

/**
 * @param {Element} element
 */
ck.knockout.ViewModel.prototype.bind = function (element) {
  ko.applyBindings(this, element);
};

/** @inheritDoc */
ck.knockout.ViewModel.prototype.disposeInternal = function () {
  goog.array.forEach(this.subscriptions_ || [], function (sub) {
    sub['dispose']();
  });
  this.subscriptions_ = [];

  goog.base(this, 'disposeInternal');
};

/**
 * @private
 * @param {Object} value
 * @return {boolean}
 */
ck.knockout.ViewModel.prototype.isObservableCollection_ = function (value) {
  return ko.isObservable(value);
};

/**
 * @private
 * @param {Object} value
 * @return {boolean}
 */
ck.knockout.ViewModel.prototype.isObservableModel_ = function (value) {
  if (goog.isObject(value)) {
    return goog.object.some(value, function (value) {
      return ko.isObservable(value);
    });
  }

  return false;
};

/**
 * @param {string} observableName
 * @param {Function} callback
 * @param {Object=} opt_context
 * @param {string=} opt_event
 * @return {Object}
 */
ck.knockout.ViewModel.prototype.subscribe = function (observableName, callback, opt_context, opt_event) {
  var observable, subscription;

  observable = this[observableName];

  if (!ko.isObservable(observable)) {
    throw goog.string.subs(
      'Tried to subscribe to %s, which is not an observable',
      observableName
    );
  }

  if (opt_context) {
    subscription = observable['subscribe'](callback, opt_context, opt_event);
  } else {
    subscription = observable['subscribe'](callback);
  }

  this.subscriptions_.push(subscription);

  return subscription;
};

/**
 * @return {goog.events.EventHandler}
 */
ck.knockout.ViewModel.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * @type {goog.events.EventHandler}
 */
ck.knockout.ViewModel.prototype.handler_ = null;
