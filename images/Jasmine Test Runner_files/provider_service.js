goog.provide('ck.data.service.ProviderService');

goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('ck.data.Limits');
goog.require('ck.init');
goog.require('ck.Logger');
goog.require('ck.data.service.Service');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {ck.data.service.Service}
 */
ck.data.service.ProviderService = function () {
  goog.base(this);

  this.handler_ = new goog.events.EventHandler(this);
  this.limits_ = new ck.data.Limits();
  this.updateStrategyFactory_ = ck.data.service.UpdateStrategyFactory.getInstance();

  this.dependencies_ = [];

  this.registerDisposable(this.handler_);
  this.registerDisposable(this.limits_);

  this.errors_ = [];
  this.timeouts_ = [];

  // If we use the ProviderService, the site is usable.  Views/tables/etc that
  // require data and don't get it may show errors, however.
  ck.init.setAppStatus(true);
};
goog.inherits(ck.data.service.ProviderService, goog.events.EventTarget);

/**
 * @param {ck.data.Provider} provider
 */
ck.data.service.ProviderService.prototype.setProvider = function (provider) {
  this.provider_ = provider;
  this.limits_.setProvider(provider);

  goog.array.forEach(this.dependencies_, function (dependency) {
    if (dependency.collection.setProvider) {
      dependency.collection.setProvider(provider);
    }
  });
};

/**
 * @return {ck.data.Provider}
 */
ck.data.service.ProviderService.prototype.getProvider = function () {
  return this.provider_;
};

/**
 * @return {ck.data.Limits}
 */
ck.data.service.ProviderService.prototype.getLimits = function () {
  return this.limits_;
};

/**
 * @param {servo.Collection|servo.Model} dependency
 * @param {ck.data.service.UpdateStrategy=} opt_strategy
 * @param {function(): boolean=} opt_isOverLimit
 */
ck.data.service.ProviderService.prototype.addDependency = function (dependency, opt_strategy, opt_isOverLimit) {

  this.dependencies_.push({
    collection: dependency,
    isOverLimit: opt_isOverLimit || function (limits) { return false; },
    pollingStrategy: opt_strategy
  });
  if (opt_strategy) {
    this.updateStrategyFactory_.updateWithStrategy(dependency, opt_strategy);
  }

  this.registerDisposable(dependency);
};

/**
 * Retrieve a dependency from a provider service, e.g.
 *   // return limits
 *   service.getDependency(ck.data.Limits)
 *   // return all flavors
 *   service.getDependency(ck.data.servers.Flavors)
 *   // return one flavor
 *   service.getDependency(ck.data.servers.Flavors, flavorId)
 * @suppress {checkTypes}
 */
ck.data.service.ProviderService.prototype.getDependency = function (clazz) {
  var matched, dependency, restArgs, pollingStrategy, model;

  if (clazz === ck.data.Limits) {
    return this.limits_;
  } else if (clazz === ck.data.Provider) {
    return this.provider_;
  }

  matched = goog.array.find(this.dependencies_, function (dependency) {
    return dependency.collection instanceof clazz;
  });

  if (!matched) {
    return null;
  }

  dependency = matched.collection;

  restArgs = goog.array.toArray(arguments).slice(1);

  if (goog.array.isEmpty(restArgs)) {
    return dependency;
  } else if (dependency instanceof servo.Collection) {
    model = this.getModelDependencyFromCollection_(
      /** @type {servo.Collection} */ (dependency),
      /** @type {number|string} */ (restArgs[0])
    );

    if (model) {
      pollingStrategy = matched.pollingStrategy;
      this.updateStrategyFactory_.updateWithStrategy(
        model,
        pollingStrategy
      );
    }

    return model;
  }

  throw 'Unable to match dependency';
};

/**
 * @private
 * @param {servo.Collection} collection
 * @param {number|string} id
 */
ck.data.service.ProviderService.prototype.getModelDependencyFromCollection_ = function (collection, id) {
  var model;

  if (!goog.isDefAndNotNull(id)) {
    // No id is specified, so no model should be created.  This allows for the
    // use case of looking up a flavor/image that may or may not exist any
    // longer, e.g.
    //
    // var imageId = server.get('imageId');
    // getDependency(ck.data.servers.Image, imageId);
    return null;
  }

  model = collection.getModelById(id);

  if (!model) {
    model = new (collection.getModelClass())({
      id: id
    });
    collection.addModel(model);
  }

  return model;
};

/**
 * @return {boolean}
 */
ck.data.service.ProviderService.prototype.isLoaded = function () {
  return this.isLoaded_;
};

/**
 * @return {boolean}
 */
ck.data.service.ProviderService.prototype.isLoading = function () {
  return this.isLoading_;
};

/**
 * @return {boolean}
 */
ck.data.service.ProviderService.prototype.isTimeout = function () {
  return this.isTimeout_;
};

/**
 * @return {boolean}
 */
ck.data.service.ProviderService.prototype.isError = function () {
  return this.isError_;
};

/**
 * @return {Array.<servo.events.StoreErrorEvent>}
 */
ck.data.service.ProviderService.prototype.getErrors = function () {
  return this.errors_;
};

/**
 * @return {Array.<servo.events.StoreTimeoutEvent>}
 */
ck.data.service.ProviderService.prototype.getTimeouts = function () {
  return this.timeouts_;
};

/**
 * @return {ck.data.service.UpdateStrategyFactory}
 */
ck.data.service.ProviderService.prototype.getUpdateStrategyFactory = function () {
  return this.updateStrategyFactory_;
};

/**
 */
ck.data.service.ProviderService.prototype.update = function () {
  throw "Provider service update is deprecated: do not call";
};

/**
 * @protected
 * @type {goog.events.EventHandler}
 */
ck.data.service.ProviderService.prototype.handler_ = null;

/**
 * @private
 * @type {Array.<Object>}
 */
ck.data.service.ProviderService.prototype.dependencies_ = null;

/**
 * @private
 * @type {ck.data.Limits}
 */
ck.data.service.ProviderService.prototype.limits_ = null;

/**
 * @private
 * @type {ck.data.Provider}
 */
ck.data.service.ProviderService.prototype.provider_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.data.service.ProviderService.prototype.isLoaded_ = false;

/**
 * @private
 * @type {boolean}
 */
ck.data.service.ProviderService.prototype.isLoading_ = false;

/**
 * @private
 * @type {boolean}
 */
ck.data.service.ProviderService.prototype.isError_ = false;

/**
 * @private
 * @type {boolean}
 */
ck.data.service.ProviderService.prototype.isTimeout_ = false;

/**
 * @private
 * @type {Array.<servo.events.StoreErrorEvent>}
 */
ck.data.service.ProviderService.prototype.errors_ = null;

/**
 * @private
 * @type {Array.<servo.events.StoreTimeoutEvent>}
 */
ck.data.service.ProviderService.prototype.timeouts_ = null;

/**
 * @private
 * @type {ck.data.service.UpdateStrategyFactory}
 */
ck.data.service.ProviderService.prototype.updateStrategyFactory_ = null;

/**
 * @enum {string}
 */
ck.data.service.ProviderService.EventType = {
  UPDATE: goog.events.getUniqueId('UPDATE'),
  ERROR: goog.events.getUniqueId('ERROR'),
  TIMEOUT: goog.events.getUniqueId('TIMEOUT'),
  UNAVAILABLE: goog.events.getUniqueId('UNAVAILABLE')
};
