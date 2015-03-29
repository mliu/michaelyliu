goog.provide('ck.data.service.PollingOrchestrator');

goog.require('ck.data.service.ServiceRegistry');
goog.require('goog.events.EventTarget');
goog.require('ck.data.service.UpdateStrategyFactory');
goog.require('ck.data.service.PollingLiveUpdater');

/**
 * @constructor
 * @param {ck.data.service.UpdateStrategyFactory} opt_updateStrategyFactory
 * @param {ck.data.service.ServiceRegistry} opt_serviceRegistry
 * @extends {goog.events.EventTarget}
 */
ck.data.service.PollingOrchestrator = function (opt_updateStrategyFactory, opt_serviceRegistry) {
  this.updateStrategyFactory_ = opt_updateStrategyFactory || ck.data.service.UpdateStrategyFactory.getInstance();
  this.serviceRegistry_ = opt_serviceRegistry || ck.data.service.ServiceRegistry.getInstance();

  this.registeredDependencies_ = {};
  this.updaters_ = {};
};
goog.inherits(ck.data.service.PollingOrchestrator, goog.events.EventTarget);
goog.addSingletonGetter(ck.data.service.PollingOrchestrator);

/**
 * @param {Array} dependencyArgs
 * @param {goog.Disposable} owner
 */
ck.data.service.PollingOrchestrator.prototype.register = function (dependencyArgs, owner) {
  var uid, dependency, updater, strategy;

  dependency = this.getDependencyForArgs_(dependencyArgs);
  uid = goog.getUid(dependency);
  if (!this.registeredDependencies_[uid]) {
    this.registeredDependencies_[uid] = [];
  }

  strategy = this.updateStrategyFactory_.getStrategy(dependency);
  if (strategy.shouldUpdate()) {
    updater = this.updaters_[uid];
    if (!updater) {
      updater = this.createUpdater_(dependency);
      updater.setInterval(strategy.getInterval());
      updater.start();
      this.updaters_[uid] = updater;
    }
    else {
      updater.resume();
    }
  }
  this.registeredDependencies_[uid].push(owner);
};

/**
 * @private
 * @param {servo.Model|servo.Collection} dependency
 */
ck.data.service.PollingOrchestrator.prototype.createUpdater_ = function (dependency) {
  var updater;

  updater = new ck.data.service.PollingLiveUpdater(dependency);
  this.registerDisposable(updater);

  return updater;
};

/**
 * @param {goog.Disposable} owner
 */
ck.data.service.PollingOrchestrator.prototype.unregister = function (owner) {
  var dependency, uid, updater, dependencies;

  goog.object.forEach(this.registeredDependencies_, function(dependencies, dependencyId) {
    goog.array.remove(dependencies, owner);
    if (goog.array.isEmpty(dependencies)) {
      if (this.updaters_[dependencyId]) {
        this.updaters_[dependencyId].pause();
      }
    }
  }, this);
};

/**
 * @private
 * @param {Array} dependencyArgs
 * @return {servo.Model|servo.Collection}
 */
ck.data.service.PollingOrchestrator.prototype.getDependencyForArgs_ = function (dependencyArgs) {
  var serviceRegistry;

  serviceRegistry = this.serviceRegistry_;
  return /** @type {servo.Model|servo.Collection} */ (serviceRegistry.getDependency.apply(
    serviceRegistry,
    dependencyArgs
  ));
};

/**
 * @param {Object} dependency
 * @return {ck.data.service.PollingLiveUpdater}
 */
ck.data.service.PollingOrchestrator.prototype.getUpdater = function (dependency) {
  var uid;

  uid = goog.getUid(dependency);
  if (goog.isDefAndNotNull(this.registeredDependencies_[uid])) {
    return this.updaters_[uid];
  }

  return null;
};

/**
 * @private
 * @type {ck.data.service.UpdateStrategyFactory}
 */
ck.data.service.PollingOrchestrator.prototype.updateStrategyFactory_ = null;

/**
 * @private
 * @type {ck.data.service.ServiceRegistry}
 */
ck.data.service.PollingOrchestrator.prototype.serviceRegistry_ = null;

/**
 * @private
 * @type {Object.<number,Array.<servo.Model|servo.Collection>>}
 */
ck.data.service.PollingOrchestrator.prototype.registeredDependencies_ = null;

/**
 * @private
 * @type {Object.<number,ck.data.service.PollingLiveUpdater>}
 */
ck.data.service.PollingOrchestrator.prototype.updaters_ = null;
