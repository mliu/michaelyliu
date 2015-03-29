goog.provide('ck.data.service.ServiceRegistry');

goog.require('ck.data.Providers');
goog.require('goog.Disposable');
goog.require('goog.events.EventHandler');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('ck.ModuleManager');

goog.require('ck.data.EntityTags');
goog.require('ck.data.service.ServiceFactory');
goog.require('ck.data.service.AggregateProviderService');

/**
 * Owns loading data from different endpoints.
 * Used to wire views into when ready (e.g. show loading pattern, show error
 * state, show timeout state)
 *
 * @constructor
 * @extends {goog.Disposable}
 */
ck.data.service.ServiceRegistry = function () {
  this.services_ = {};
  this.updatingDependencies_ = [];

  this.handler_ = new goog.events.EventHandler(this);

  this.providers_ = new ck.data.Providers();
  this.providers_.load();

  this.tags_ = new ck.data.EntityTags();

  this.moduleManager_ = ck.ModuleManager.getInstance();

  this.registerDisposable(this.handler_);
  this.registerDisposable(this.providers_);
  this.registerDisposable(this.tags_);
};
goog.inherits(ck.data.service.ServiceRegistry, goog.Disposable);

goog.addSingletonGetter(ck.data.service.ServiceRegistry);

/**
 * Retrieve a dependency from an service, e.g.
 *   // retrieve all providers
 *   serviceRegistry.getDependency(ck.data.Providers)
 *   // retrieve an individual
 *   serviceRegistry.getDependency(ck.data.Providers, providerId)
 *   // retrieve the aggregate compute service
 *   serviceRegistry.getDependency(ck.data.Providers.ServiceType.COMPUTE)
 *   // retrieve the provider service for a provider
 *   serviceRegistry.getDependency(firstGenProvider)
 *     (calls aggregateComputeService.getService(firstGenProvider.id())
 *   // retrieve a collection from a provider service
 *   serviceRegistry.getDependency(dnsProvider, ck.data.dns.Domains)
 *   // retrieve the collection with a provider id
 *   serviceRegistry.getDependency('DNS', dnsProviderId, ck.data.dns.Domains)
 * @param {*} dependency
 * @param {...*} var_args
 */
ck.data.service.ServiceRegistry.prototype.getDependency = function (dependency, var_args) {
  var serviceDependency, argsArray;

  argsArray = goog.array.toArray(arguments).slice(1);

  if (dependency === ck.data.EntityTags) {
    return this.tags_;
  }

  // Case 1: return providers dependency
  if (dependency === ck.data.Providers) {
    if (goog.array.isEmpty(argsArray)) {
      return this.providers_;
    }

    // Case 1a: return an individual provider
    return this.providers_.getModelById(argsArray[0]);
  }

  // Case 2: passed in a provider, apply getDependency to the serviceType and id
  if (dependency instanceof ck.data.Provider) {
    argsArray.unshift(dependency.get('serviceType'), dependency.id());
    return this.getDependency.apply(this, argsArray);
  }

  // Case 3: first argument is a service type, get the corresponding service,
  // creating it if it doesn't exist.
  dependency = /** @type {ck.data.Providers.ServiceType} */ (dependency);
  if (!this.services_[dependency]) {
    this.services_[dependency] = this.createNewDependency(dependency);
  }

  serviceDependency = this.services_[dependency];
  if (goog.array.isEmpty(argsArray)) {
    return serviceDependency;
  }

  if (!goog.isDefAndNotNull(serviceDependency)) {
    throw 'Module was not loaded yet';
  }

  // Case 3 (continued): apply any remaining arguments to the resulting
  // service's getDependency
  return serviceDependency.getDependency.apply(serviceDependency, argsArray);
};

/**
 * Instantiate a ProviderService object for a dependency type.
 *
 * @param {ck.data.Providers.ServiceType} dependency
 * @return {ck.data.service.Service}
 */
ck.data.service.ServiceRegistry.prototype.createNewDependency = function (dependency) {
  var Registrations, ModuleForType;

  Registrations = ck.data.service.ServiceFactory.Registrations;
  ModuleForType = ck.data.service.ServiceRegistry.ModuleForType;

  if (ModuleForType[dependency]) {
    this.moduleManager_.execOnLoad(
      ModuleForType[dependency],
      function () {
        var factory;

        if(!this.services_[dependency]) {
          factory = new Registrations[dependency]();
          this.services_[dependency] = factory.create(dependency);
        }
      },
      this,
      undefined,
      undefined,
      true // execute immediately if the module is loaded
    );

    if (this.services_[dependency]) {
      return this.services_[dependency];
    }
    return null;
  }

  throw 'Invalid dependency type ' + dependency;
};

/**
 * @param {Array.<Array.<Object>>} dependencyArgs
 * @param {?=} opt_onLoadCallback
 * @param {?=} opt_onErrorCallback
 * @param {?=} opt_onTimeoutCallback
 * @param {goog.Disposable=} opt_context
 * @return {goog.async.Deferred}
 */
ck.data.service.ServiceRegistry.prototype.require = function (dependencyArgs, opt_onLoadCallback, opt_onErrorCallback, opt_onTimeoutCallback, opt_context) {
  var deferreds, deferredList;

  deferreds = [];

  goog.array.forEach(dependencyArgs, function (args) {
    var dependencyType, restArgs, dependency, deferred, service;

    dependencyType = args[0];
    restArgs = args.slice(1);

    service = this.getDependency(dependencyType);

    if (service === null) {
      // service is not loaded.  we must wait for it to load
      deferred = new goog.async.Deferred();
      this.moduleManager_.execOnLoad(
        ck.data.service.ServiceRegistry.ModuleForType[dependencyType],
        function () {
          var dependencyDeferred;

          dependencyDeferred = this.getDeferredForRequirement_(
            dependencyType,
            restArgs
          );
          dependencyDeferred.addCallback(function (type) {
            deferred.callback(type);
          });
        },
        this,
        undefined,
        undefined,
        true // execute immediately if the module is loaded
      );
    } else {
      deferred = this.getDeferredForRequirement_(dependencyType, restArgs);
    }
    deferreds.push(deferred);
  }, this);

  deferredList = new goog.async.DeferredList(deferreds, false, false);
  deferredList.addCallback(
    goog.bind(this.onDependenciesLoaded_, this, opt_onLoadCallback, opt_onErrorCallback, opt_onTimeoutCallback, opt_context)
  );
  return deferredList;
};

/**
 * @private
 * @return {goog.async.Deferred}
 */
ck.data.service.ServiceRegistry.prototype.getDeferredForRequirement_ = function (dependencyType, restArgs) {
  var service, dependency;

  service = this.getDependency(dependencyType);

  if (this.isModelOrCollectionDependency_(service)) {
    return this.getDeferredForDependency_(service);
  } else if (goog.array.isEmpty(restArgs)) {
    return this.getDeferredForServiceRequirement_(service);
  } else {
    dependency = service.getDependency.apply(service, restArgs);
    return this.getDeferredForDependency_(dependency);
  }
};

/**
 * @private
 * @return {goog.async.Deferred}
 */
ck.data.service.ServiceRegistry.prototype.getDeferredForDependency_ = function (dependency) {
  var deferred;

  if (this.isServiceDependency_(dependency)) {
    return this.getDeferredForServiceRequirement_(dependency);
  } else if (this.isModelOrCollectionDependency_(dependency)) {
    return this.getDeferredForModelOrCollection_(dependency);
  } else {
    throw 'Could not determine deferred for dependency';
  }
};

/**
 * @private
 * @return {boolean}
 */
ck.data.service.ServiceRegistry.prototype.isServiceDependency_ = function (dependency) {
  return (dependency instanceof ck.data.service.AggregateProviderService ||
          dependency instanceof ck.data.service.ProviderService);
};

/**
 * @private
 * @return {boolean}
 */
ck.data.service.ServiceRegistry.prototype.isModelOrCollectionDependency_ = function (dependency) {
  return (dependency instanceof servo.Model ||
          dependency instanceof servo.Collection);
};

/**
 * @private
 * @return {goog.async.Deferred}
 */
ck.data.service.ServiceRegistry.prototype.getDeferredForServiceRequirement_ = function (service) {
  var handler, deferred;

  deferred = new goog.async.Deferred();

  if (service.isLoaded()) {
    deferred.callback(undefined);
  } else if (service.isError()) {
    deferred.callback(service.getErrors());
  } else if (service.isTimeout()) {
    deferred.callback(service.getTimeouts());
  } else {
    handler = new goog.events.EventHandler(this);
    this.registerDisposable(handler);

    handler.listenOnce(
      service,
      [ck.data.service.ProviderService.EventType.UPDATE,
       ck.data.service.ProviderService.EventType.ERROR,
       ck.data.service.ProviderService.EventType.TIMEOUT],
      function (e) {
        handler.dispose();
        deferred.callback([e]);
      }
    );
  }

  if (!deferred.hasFired() && !service.isLoading()) {
      service.update();
  }

  return deferred;
};

/**
 * @private
 * @return {goog.async.Deferred}
 */
ck.data.service.ServiceRegistry.prototype.getDeferredForModelOrCollection_ = function (dependency) {
  var deferred, handler;

  deferred = new goog.async.Deferred();

  if (dependency.hasSynced()) {
    deferred.callback(undefined);
  } else if (dependency.hasTimeout()) {
    deferred.callback(dependency.getTimeouts());
  } else if (dependency.hasError()) {
    deferred.callback(dependency.getErrors());
  } else {
    handler = new goog.events.EventHandler(this);
    this.registerDisposable(handler);

    handler.listenOnce(
      dependency,
      [servo.events.EventType.SYNC,
       servo.events.EventType.ERROR,
       servo.events.EventType.TIMEOUT],
      function (e) {
        handler.dispose();
        deferred.callback([e]);
      }
    );
  }

  if (!deferred.hasFired() && !dependency.isLoading()) {
    dependency.fetch();
  }

  return deferred;
};

/**
 * @private
 * @param {function ():*} onLoadCallback
 * @param {function (*):*} onErrorCallback
 * @param {function (*):*} onTimeoutCallback
 * @param {goog.Disposable} context
 * @param {Array} results
 */
ck.data.service.ServiceRegistry.prototype.onDependenciesLoaded_ = function (onLoadCallback, onErrorCallback, onTimeoutCallback, context, results) {
  var hasLoaded, hasTimeout, events;

  if (this.contextNoLongerRequiresData_(context)) {
    return;
  }

  events = goog.array.flatten(goog.array.map(results, function (result) {
    return result[1];
  }));

  hasLoaded = goog.array.every(events, function (result) {
    return this.isLoadedEvent_(result);
  }, this);

  hasTimeout = goog.array.every(events, function (result) {
    return this.isTimeoutEvent_(result);
  }, this);

  events = goog.array.filter(events, function (e) {
    return goog.isDefAndNotNull(e);
  });

  if (hasLoaded && onLoadCallback) {
    onLoadCallback.call(context);
  } else if (hasTimeout && onTimeoutCallback) {
    onTimeoutCallback.call(context, events);
  } else if (onErrorCallback) {
    onErrorCallback.call(context, events);
  }
};

/**
 * @param {goog.events.Event} e
 * @return {boolean}
 */
ck.data.service.ServiceRegistry.prototype.isLoadedEvent_ = function (e) {
  if (!e) {
    return true;
  }

  return (e.type === servo.events.EventType.SYNC ||
          e.type === ck.data.service.ProviderService.EventType.UPDATE);
};

/**
 * @param {goog.events.Event} e
 * @return {boolean}
 */
ck.data.service.ServiceRegistry.prototype.isTimeoutEvent_ = function (e) {
  if (!e) {
    return false;
  }

  return (e.type === servo.events.EventType.TIMEOUT ||
          e.type === ck.data.service.ProviderService.EventType.TIMEOUT);
};

/**
 * @private
 * @param {goog.Disposable} context
 */
ck.data.service.ServiceRegistry.prototype.contextNoLongerRequiresData_ = function (context) {
  return (context &&
          goog.isFunction(context.isDisposed) &&
          context.isDisposed());
};

/**
 * @return {ck.data.Providers}
 */
ck.data.service.ServiceRegistry.prototype.getProviders = function () {
  return this.providers_;
};

/**
 * Setter for testing.
 * @param {ck.data.Providers} providers
 */
ck.data.service.ServiceRegistry.prototype.setProviders = function (providers) {
  this.providers_ = providers;
};


/**
 * @return {ck.data.EntityTags}
 */
ck.data.service.ServiceRegistry.prototype.getTags = function () {
  return this.tags_;
};

/**
 * @private
 * @type {Object.<ck.data.Providers.ServiceType,ck.data.service.Service>}
 */
ck.data.service.ServiceRegistry.prototype.services_ = null;

/**
 * @private
 * @type {Array.<ck.data.Providers.ServiceType>}
 */
ck.data.service.ServiceRegistry.prototype.updatingDependencies_ = null;

/**
 * @private
 * @type {ck.data.Providers}
 */
ck.data.service.ServiceRegistry.prototype.providers_ = null;

/**
 * @private
 * @type {ck.data.EntityTags}
 */
ck.data.service.ServiceRegistry.prototype.tags_ = null;

/**
 * @private
 * @type {goog.events.EventHandler}
 */
ck.data.service.ServiceRegistry.prototype.handler_ = null;

/**
 * @private
 * @type {ck.ModuleManager}
 */
ck.data.service.ServiceRegistry.prototype.moduleManager_ = null;

/**
 * @public
 * @param {*} dependency
 * @param {...*} var_args
 */
ck.data.service.ServiceRegistry.getDependencyFromSingleton = function (dependency, var_args) {
  var serviceRegistry, argsArray;

  serviceRegistry = ck.data.service.ServiceRegistry.getInstance();
  argsArray = Array.prototype.slice.call(arguments);
  return serviceRegistry.getDependency.apply(serviceRegistry, argsArray);
};

ck.data.service.ServiceRegistry.ModuleForType = {};
(function () {
  var ModuleForType, ServiceType;

  ModuleForType = ck.data.service.ServiceRegistry.ModuleForType;
  ServiceType = ck.data.Providers.ServiceType;

  ModuleForType[ServiceType.DNS] = 'dns_service';
  ModuleForType[ServiceType.CUSTOMER] = 'account_service';
  ModuleForType[ServiceType.DATABASE] = 'database_service';
  ModuleForType[ServiceType.FILES] = 'files_service';
  ModuleForType[ServiceType.BLOCKSTORAGE] = 'blockstorage_service';
  ModuleForType[ServiceType.COMPUTE] = 'servers_service';
  ModuleForType[ServiceType.LOADBALANCER] = 'loadbalancer_service';
  ModuleForType[ServiceType.OFFERINGS] = 'offerings_service';
  ModuleForType[ServiceType.BILLING] = 'billing_service';
  ModuleForType[ServiceType.SUPPORT] = 'support_service';
  ModuleForType[ServiceType.PAYMENT_USER] = 'payment_user_service';
  ModuleForType[ServiceType.TICKETS] = 'ticketing_service';
  ModuleForType[ServiceType.MONITORING] = 'monitoring_service';
  ModuleForType[ServiceType.DEPLOYMENTS] = 'deployments_service';
  ModuleForType[ServiceType.BLUEPRINTS] = 'deployments_service';
  ModuleForType[ServiceType.AUTOSCALE] = 'autoscale_service';
  ModuleForType[ServiceType.IDENTITY] = 'identity_service';
  ModuleForType[ServiceType.QUEUES] = 'queues_service';
  ModuleForType[ServiceType.BIGDATA] = 'bigdata_service';
  ModuleForType[ServiceType.BACKUPS] = 'backups_service';
  ModuleForType[ServiceType.ORCHESTRATION] = 'orchestration_service';
  ModuleForType[ServiceType.RACKCONNECTV3] = 'rackconnect3_service';
}());
