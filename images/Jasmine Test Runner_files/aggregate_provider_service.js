goog.provide('ck.data.service.AggregateProviderService');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('ck.data.service.Service');
goog.require('ck.data.service.CollectionSyncer');
goog.require('ck.data.Providers');
goog.require('ck.data.service.ProviderService');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {ck.data.service.Service}
 */
ck.data.service.AggregateProviderService = function () {
  goog.base(this);

  this.services_ = [];
  this.dependencies_ = [];
  this.collectionSyncers_ = {};
  this.isUsingLimits_ = false;

  this.handler_ = new goog.events.EventHandler(this);
  this.providers_ = new ck.data.Providers();
};
goog.inherits(ck.data.service.AggregateProviderService, goog.events.EventTarget);

/**
 * @return {ck.data.Providers}
 */
ck.data.service.AggregateProviderService.prototype.getProviders = function () {
  return this.providers_;
};

/**
 * @param {ck.data.service.ProviderService} service
 */
ck.data.service.AggregateProviderService.prototype.addService = function (service) {
  this.services_.push(service);

  this.providers_.addModel(service.getProvider());

  goog.array.forEach(this.dependencies_, function (dependency) {
    var syncer, collection, CollectionClass, addDependencyArgs;

    CollectionClass = dependency.collectionClass;

    collection = new CollectionClass();
    collection.setProvider(service.getProvider());

    addDependencyArgs = goog.array.concat([collection], dependency.args);
    service.addDependency.apply(service, addDependencyArgs);

    syncer = this.getCollectionSyncer(CollectionClass);
    if (syncer) {
      syncer.syncCollection(service.getDependency(CollectionClass));
    }
  }, this);

  this.handler_.listenOnce(
    service,
    ck.data.service.ProviderService.EventType.UNAVAILABLE,
    this.removeUnavailableProvider_
  );
};

/**
 * @param {function(new:servo.Collection, ...[?]):undefined|function(new:servo.Model, ...[?]):undefined} dependency
 * @param {ck.data.service.UpdateStrategy=} opt_strategy
 * @param {function(): boolean=} opt_isOverLimit
 */
ck.data.service.AggregateProviderService.prototype.addDependency = function (dependency, opt_strategy, opt_isOverLimit) {
  this.dependencies_.push({
    collectionClass: dependency,
    args: goog.array.toArray(arguments).slice(1)
  });
};

/**
 * @param {function(new:servo.Collection, ...[?]):undefined} dependency
 * @param {ck.data.service.UpdateStrategy=} opt_strategy
 * @param {function(): boolean=} opt_isOverLimit
 */
ck.data.service.AggregateProviderService.prototype.addAggregateDependency = function (dependency, opt_strategy, opt_isOverLimit) {
  this.addDependency.apply(this, goog.array.toArray(arguments));
  this.addCollectionSyncer(dependency);
};

/**
 * Retrieve a dependency from an aggregate provider service, e.g.
 *   // return limits
 *   service.getDependency(ck.data.Limits)
 *   // return aggregate flavors
 *   service.getDependency(ck.data.servers.Flavors)
 *   // return flavors for a specific provider id
 *   service.getDependency(providerId, ck.data.servers.Flavors)
 *   // return a specific id from an aggregate collection (requires ids to be
 *   // unique across all provider services!)
 *   service.getDependency(providerId, ck.data.servers.Flavors)
 *   @param {...} var_args
 */
ck.data.service.AggregateProviderService.prototype.getDependency = function (var_args) {
  var argsArray, service, syncer, collection;

  argsArray = Array.prototype.slice.call(arguments);
  if (goog.isString(argsArray[0])) {
    service = this.getServiceForProvider(argsArray[0]);
    if (argsArray.length === 1) {
      return service;
    }

    return service.getDependency.apply(service, argsArray.slice(1));
  }

  syncer = this.getCollectionSyncer(argsArray[0]);
  if (syncer) {
    collection = syncer.getAggregatedCollection();

    if (argsArray.length === 1) {
      return collection;
    }

    return collection.getModelById(argsArray[1]);
  }

  throw 'Unable to find dependency';
};

/**
 * @private
 * @param {goog.events.Event} e
 */
ck.data.service.AggregateProviderService.prototype.removeUnavailableProvider_ = function (e) {

  var provider;

  provider = e.target.getProvider();
  this.providers_.removeModel(provider);
};

/**
 * @protected
 * @param {string} id
 * @return {ck.data.service.ProviderService}
 */
ck.data.service.AggregateProviderService.prototype.getServiceForProvider = function (id) {

  var service;

  service = goog.array.find(this.services_, function (service) {
    return service.getProvider().id() === id;
  });
  return /** @type {ck.data.service.ProviderService} */ (service);
};

/**
 */
ck.data.service.AggregateProviderService.prototype.update = function () {

  var deferreds, deferredList;

  if (!this.isLoaded_) {
    this.isLoading_ = true;
  }
  deferreds = this.getUpdateList();

  if (goog.array.isEmpty(deferreds)) {
    this.onLoaded();
  } else {
    deferredList = new goog.async.DeferredList(deferreds);
    deferredList.addBoth(this.onUpdate_, this);
  }
};

/**
 * @return {boolean}
 */
ck.data.service.AggregateProviderService.prototype.isLoaded = function () {
  return this.isLoaded_;
};

/**
 * @return {boolean}
 */
ck.data.service.AggregateProviderService.prototype.isLoading = function () {
  return this.isLoading_;
};

/**
 * @return {boolean}
 */
ck.data.service.AggregateProviderService.prototype.isTimeout = function () {
  return this.isTimeout_;
};

/**
 * @return {boolean}
 */
ck.data.service.AggregateProviderService.prototype.isError = function () {
  return this.isError_;
};

/**
 * @return {Array.<servo.events.StoreErrorEvent>}
 */
ck.data.service.AggregateProviderService.prototype.getErrors = function () {
  return this.errors_;
};

/**
 * @return {Array.<servo.events.StoreTimeoutEvent>}
 */
ck.data.service.AggregateProviderService.prototype.getTimeouts = function () {
  return this.timeouts_;
};

/**
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.getUpdateList = function () {
  var allowedServices;

  // This is only used by Cloud Files now
  allowedServices = goog.array.filter(this.services_, function (service) {
    return service.getProvider().isActive();
  });
  return goog.array.map(allowedServices, this.waitForServiceUpdate_, this);
};

/**
 * @private
 * @param {ck.servers.cache.ComputeService} service
 * @return {goog.async.Deferred}
 */
ck.data.service.AggregateProviderService.prototype.waitForServiceUpdate_ = function (service) {
  return this.waitForUpdate_(
    service,
    service.update,
    ck.data.service.ProviderService.EventType.UPDATE,
    [ck.data.service.ProviderService.EventType.ERROR,
     ck.data.service.ProviderService.EventType.TIMEOUT]
  );
};

/**
 * @protected
 * @param {goog.events.EventTarget} target
 * @param {function()} action
 * @param {string|Array} success
 * @param {string|Array} error
 * @return {goog.async.Deferred}
 */
ck.data.service.AggregateProviderService.prototype.waitForUpdate_ = function (target, action, success, error) {

  var deferred, handler;

  deferred = new goog.async.Deferred();
  action.call(target);

  handler = new goog.events.EventHandler(this);
  this.registerDisposable(handler);

  handler.listenOnce(
    target,
    success,
    function () {
      handler.dispose();
      deferred.callback();
    }
  );
  handler.listenOnce(
    target,
    error,
    function (e) {
      handler.dispose();
      deferred.errback(e);
    }
  );

  return deferred;
};

/**
 * @private
 * @param {Array} deferreds
 */
ck.data.service.AggregateProviderService.prototype.onUpdate_ = function (deferreds) {
  if (this.isSuccessful_(deferreds)) {
    this.onLoaded();
  } else {
    this.onError(this.getFailures_(deferreds));
  }
};

/**
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.onLoaded = function () {
  this.isLoaded_ = true;
  this.isLoading_ = false;
  this.isError_ = false;
  this.dispatchEvent(ck.data.service.ProviderService.EventType.UPDATE);
};

/**
 * @protected
 * @param {Array.<goog.events.Event>} failures
 */
ck.data.service.AggregateProviderService.prototype.onError = function (failures) {
  this.isError_ = true;
  this.isLoaded_ = false;
  this.errors_ = failures;
  this.dispatchEvent(ck.data.service.ProviderService.EventType.ERROR);
};

/**
 * @private
 * @param {Array} deferreds
 */
ck.data.service.AggregateProviderService.prototype.isSuccessful_ = function (deferreds) {
  return goog.array.some(deferreds, function (deferred) {
    return deferred[0];
  });
};

/**
 * @private
 * @param {Array} deferreds
 * @return {Array}
 */
ck.data.service.AggregateProviderService.prototype.getFailures_ = function (deferreds) {
  var failures;

  failures = goog.array.filter(deferreds, function (deferred) {
    return !deferred[0];
  });
  return goog.array.map(failures, function (deferred) {
    return deferred[1];
  });
};

/**
 * @return {ck.data.service.CollectionSyncer}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.getCollectionSyncer = function (dependency) {
  return this.collectionSyncers_[goog.getUid(dependency)];
};

/**
 * @param {function(new:servo.Collection):undefined} dependency
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.addCollectionSyncer = function (dependency) {
  var syncer;

  syncer = new ck.data.service.CollectionSyncer(dependency);
  this.registerDisposable(syncer);

  this.collectionSyncers_[goog.getUid(dependency)] = syncer;
};

/**
 */
ck.data.service.AggregateProviderService.prototype.enableLimitChecking = function () {
  this.isUsingLimits_ = true;
};

/**
 * @type {Array.<ck.data.service.ProviderService|ck.files.service.ContainerService>}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.services_ = null;

/**
 * @type {goog.events.EventHandler}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.handler_ = null;

/**
 * @type {ck.data.Providers}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.providers_ = null;

/**
 * @type {boolean}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.isLoaded_ = false;

/**
 * @type {boolean}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.isLoading_ = false;

/**
 * @type {boolean}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.isError_ = false;

/**
 * @type {boolean}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.isTimeout_ = false;

/**
 * @type {boolean}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.isUsingLimits_ = false;

/**
 * @type {Array.<Object>}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.dependencies_ = null;

/**
 * @type {Object}
 * @protected
 */
ck.data.service.AggregateProviderService.prototype.collectionSyncers_ = null;

/**
 * @protected
 * @type {Array.<goog.events.Event>}
 */
ck.data.service.AggregateProviderService.prototype.errors_ = null;

/**
 * @protected
 * @type {Array.<goog.events.Event>}
 */
ck.data.service.AggregateProviderService.prototype.timeouts_ = null;
