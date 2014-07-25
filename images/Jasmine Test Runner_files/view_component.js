goog.provide('ck.views.ViewComponent');

goog.require('goog.ui.Component');
goog.require('ck.PerformanceTimer');
goog.require('ck.routing');
goog.require('ck.routing.Router');
goog.require('goog.async.Delay');
goog.require('ck.widgets.popovers.PopoverRegistrar');
goog.require('ck.widgets.popovers.PopoverController');
goog.require('ck.data.service.PollingOrchestrator');
goog.require('ck.Logger');
goog.require('ck.views.PopoverControllerMixin');
goog.require('ck.events.EventListenerMixin');

/**
 * Superclass for adding loading/timeout/error state to various UI elements,
 * e.g. views, popovers, tables.
 *
 * @constructor
 * @param {goog.dom.DomHelper=} opt_domHelper
 * @param {ck.PerformanceTimer=} opt_performanceTimer
 * @param {ck.widgets.popovers.PopoverController=} opt_popoverController
 * @param {ck.widgets.popovers.PopoverTrigger=} opt_popoverTrigger
 * @extends {goog.ui.Component}
 */
ck.views.ViewComponent = function (opt_domHelper, opt_performanceTimer, opt_popoverController, opt_popoverTrigger) {
  goog.base(this, opt_domHelper);

  this.serviceDependencies_ = [];
  this.aggregateDependencies_ = [];
  this.emptyAggregateDependencies_ = [];
  this.behaviors_ = [];

  this.performanceTimer_ = opt_performanceTimer || new ck.PerformanceTimer(this.getComponentName());

  ck.views.PopoverControllerMixin.extend(this, opt_popoverController, opt_popoverTrigger);
};
goog.inherits(ck.views.ViewComponent, goog.ui.Component);

ck.views.ViewComponent.prototype.hasPopover = ck.views.PopoverControllerMixin.prototype.hasPopover;
ck.views.ViewComponent.prototype.getPopoverController = ck.views.PopoverControllerMixin.prototype.getPopoverController;
ck.views.ViewComponent.prototype.removePopovers = ck.views.PopoverControllerMixin.prototype.removePopovers;
ck.views.ViewComponent.prototype.listenFirst = ck.events.EventListenerMixin.prototype.listenFirst;

/** @inheritDoc */
ck.views.ViewComponent.prototype.createDom = function () {
  var template, element;

  template = this.getTemplate();

  if (template) {
    element = /** @type {Element} */ (goog.dom.htmlToDocumentFragment(template));
    this.setElementInternal(element);
  } else {
    goog.base(this, 'createDom');
  }
};

/**
 * @protected
 * @return {string|undefined}
 */
ck.views.ViewComponent.prototype.getTemplate = goog.nullFunction;

/** @inheritDoc */
ck.views.ViewComponent.prototype.enterDocument = function () {
  var listenDelay;

  goog.base(this, 'enterDocument');

  listenDelay = new goog.async.Delay(this.listenForDependencies, 0, this);
  this.registerDisposable(listenDelay);
  listenDelay.start();

  goog.array.forEach(this.behaviors_, function (behavior) {
    if (!behavior.isInDocument()) {
      behavior.decorate(this.getElement());
    }
  }, this);
};

/**
 * @param {goog.ui.Component} behavior
 */
ck.views.ViewComponent.prototype.addBehavior = function (behavior) {
  this.behaviors_.push(behavior);
  this.addChild(behavior, false);

  return behavior;
};

/**
 * Waits for dependencies to be loaded -- if they are loaded calls
 * {@code onLoaded}, if they error calls {@code onError}, if they
 * timeout calls {@code onTimeout}.
 */
ck.views.ViewComponent.prototype.listenForDependencies = function () {
  if (this.getComponentName()) {
    this.performanceTimer_.start();
  }

  if (goog.array.isEmpty(this.aggregateDependencies_)) {
    this.dependencyRequire_ = this.getServiceRegistry().require(
      this.serviceDependencies_,
      this.onLoaded,
      this.onError,
      this.onTimeout,
      this
    );
  } else {
    this.dependencyRequire_ = this.getServiceRegistry().require(
      this.serviceDependencies_,
      this.onLoaded,
      this.wrapAggregateFailure_(this.onError),
      this.wrapAggregateFailure_(this.onTimeout),
      this
    );
  }
};

/**
 * @protected
 * @param {*} dependency
 * @param {...*} var_args
 */
ck.views.ViewComponent.prototype.addDependency = function (dependency, var_args) {
  this.serviceDependencies_.push(Array.prototype.slice.call(arguments));
};

/**
 * @protected
 * @param {Object} options
 */
ck.views.ViewComponent.prototype.requireSingleDependency = function (options) {
  this.getServiceRegistry().require(
    [options.dependency],
    options.onLoaded || goog.nullFunction,
    options.onError || goog.nullFunction,
    options.onTimeout || goog.nullFunction,
    this
  );
};

/**
 * Used to add a dependency for all collections of a given type, e.g.
 * DFW Servers, ORD Servers, LON Servers.
 *
 * The reason for providing this method is that aggregated collections are not "real"
 * collections and cannot be fetched, so to use an aggregate collection we must specify
 * a dependency on each of its 'child' collections.
 *
 * @protected
 * @param {ck.data.Providers.ServiceType} type
 * @param {*} dependency
 */
ck.views.ViewComponent.prototype.addAggregateDependency = function (type, dependency) {
  var providers;

  providers = this.getDependency(ck.data.Providers);
  providers = providers.filterByServiceType(type);
  providers = providers.filter(
    function (provider) { return provider.isActive(); }
  );

  goog.array.forEach(providers, function (provider) {
    this.addDependency(
      type,
      provider.id(),
      dependency
    );
    this.aggregateDependencies_.push([type, provider.id(), dependency]);
  }, this);

  if (goog.array.isEmpty(providers)) {
    goog.array.insert(this.emptyAggregateDependencies_, [type, dependency]);
  }
};

/**
 * @protected
 * @param {*} dependency
 * @param {...*} var_args
 */
ck.views.ViewComponent.prototype.getDependency = function (dependency, var_args) {
  var serviceRegistry, argsArray, isInvalidAggregateDependency, collection;

  serviceRegistry = this.getServiceRegistry();

  argsArray = Array.prototype.slice.call(arguments);
  isInvalidAggregateDependency = this.emptyAggregateDependencies_ && goog.array.find(
    this.emptyAggregateDependencies_,
    function (dependencies) {
      return goog.array.equals(dependencies, [argsArray[0], argsArray[1]]);
    }
  );

  if (isInvalidAggregateDependency) {
    collection = new argsArray[1]();
    this.registerDisposable(collection);
    return collection;
  } else {
    return serviceRegistry.getDependency.apply(serviceRegistry, argsArray);
  }
};

/**
 * @protected
 * @param {ck.routing.Route} route
 * @param {Array.<*>=} opt_parameters
 * @param {Object.<string, *>=} opt_queryData
 */
ck.views.ViewComponent.prototype.navigateRoute = function (route, opt_parameters, opt_queryData) {
  var parameters, queryData;

  parameters = opt_parameters || [];
  queryData = opt_queryData || {};
  ck.routing.Router.getInstance().navigate(
    ck.routing.url_for(route, parameters, goog.Uri.QueryData.createFromMap(queryData))
  );
};

/**
 * @protected
 * @return {ck.data.service.ServiceRegistry}
 */
ck.views.ViewComponent.prototype.getServiceRegistry = function () {
  if (!this.serviceRegistry_) {
    this.serviceRegistry_ = ck.data.service.ServiceRegistry.getInstance();
  }

  return this.serviceRegistry_;
};

/**
 * Called when all data for a view is loaded.
 */
ck.views.ViewComponent.prototype.onLoaded = function () {
  var orchestrator;

  orchestrator = ck.data.service.PollingOrchestrator.getInstance();
  goog.array.forEach(this.serviceDependencies_, function (dependencyArgs) {
    orchestrator.register(dependencyArgs, this);
  }, this);

  if (this.getComponentName()) {
    this.performanceTimer_.stop(ck.PerformanceTimer.Reasons.LOAD);
  }
};

/**
 * Called when all data required for a view timed out.
 */
ck.views.ViewComponent.prototype.onTimeout = function () {
  if (this.getComponentName()) {
    this.performanceTimer_.stop(ck.PerformanceTimer.Reasons.TIMEOUT);
  }
};

/**
 * Called when the data required for a view failed to load.
 * @param {...*} var_args
 */
ck.views.ViewComponent.prototype.onError = function (var_args) {
  if (this.getComponentName()) {
    this.performanceTimer_.stop(ck.PerformanceTimer.Reasons.ERROR);
  }
};

/**
 * Shows/hides the element if the parameter is true/false respectively.
 * @param {boolean} show
 */
ck.views.ViewComponent.prototype.setVisible = function (show) {
  goog.style.setElementShown(this.getElement(), show);
};

/**
 * Handle partial failure when an error is thrown for an aggregate dependency.
 * @private
 * @param {function (*):*} callback
 */
ck.views.ViewComponent.prototype.wrapAggregateFailure_ = function (callback) {
  return goog.bind(function () {
    if (this.nonAggregateDependencyHasFailed_()) {
      callback.apply(this, Array.prototype.slice.call(arguments));
    } else if (this.noProviderHasCompletelySucceeded_()) {
      callback.apply(this);
    } else {
      this.onLoaded();
    }
  }, this);
};

/**
 * @private
 * @return {boolean}
 */
ck.views.ViewComponent.prototype.nonAggregateDependencyHasFailed_ = function () {
  var nonAggregateDependencies;

  nonAggregateDependencies = goog.array.filter(
    this.getAllDependencies_(),
    function (dependency) {
      return !goog.array.contains(this.getAggregateDependencies_(), dependency);
    }, this);

  return goog.array.some(nonAggregateDependencies, function (dependency) {
    return !dependency.hasSynced();
  });
};

/**
 * @private
 * @return {Array.<Object>}
 */
ck.views.ViewComponent.prototype.getAllDependencies_ = function () {
  return this.getDependenciesFromArgsList_(this.serviceDependencies_);
};

/**
 * @private
 * @return {Array.<Object>}
 */
ck.views.ViewComponent.prototype.getAggregateDependencies_ = function () {
  return this.getDependenciesFromArgsList_(this.aggregateDependencies_);
};

/**
 * @private
 * @param {Array.<Array.<Object>>} argsList
 * @return {Array.<Object>}
 */
ck.views.ViewComponent.prototype.getDependenciesFromArgsList_ = function (argsList) {
  var serviceRegistry;

  serviceRegistry = this.serviceRegistry_;
  return goog.array.map(argsList, function (args) {
    return serviceRegistry.getDependency.apply(serviceRegistry, args);
  });
};

/**
 * @private
 * @return {boolean}
 */
ck.views.ViewComponent.prototype.noProviderHasCompletelySucceeded_ = function () {
  var dependenciesByProvider, successfulProviders, unsuccessfulProviders,
      isCompleteFailure;

  dependenciesByProvider = goog.array.bucket(
    this.getAggregateDependencies_(),
    function (dependency) {
      if (!(dependency.getProvider || !dependency.getProvider())) {
        // no bucket for a providerless dependency
        return undefined;
      }

      return dependency.getProvider().id();
    });

  successfulProviders = [];
  unsuccessfulProviders = [];
  goog.object.forEach(dependenciesByProvider, function (dependencies, provider) {
    var isSuccessful;

    isSuccessful = goog.array.every(dependencies, function (dependency) {
      return dependency.hasSynced();
    });
    if (isSuccessful) {
      successfulProviders.push(provider);
    } else {
      unsuccessfulProviders.push(provider);
    }
  });

  isCompleteFailure = goog.object.isEmpty(successfulProviders);
  if (isCompleteFailure) {
    ck.Logger.getInstance().error(
      'polling',
      'Complete failure to load dependencies',
      {
        component: this.getComponentName()
      }
    );
  } else {
    goog.array.forEach(unsuccessfulProviders, function (providerId) {
      ck.Logger.getInstance().error(
        'polling',
        'Partial failure to load dependencies',
        {
          'provider': providerId,
          'component': this.getComponentName()
        }
      );
    }, this);
  }

  return isCompleteFailure;
};

/**
 * @returns {Array.<goog.ui.Component>}
 */
ck.views.ViewComponent.prototype.getBehaviors = function () {
  return this.behaviors_;
};

/** @inheritDoc */
ck.views.ViewComponent.prototype.exitDocument = function () {
  var orchestrator;

  goog.base(this, 'exitDocument');

  if (this.dependencyRequire_) {
    this.dependencyRequire_.cancel();
  }

  orchestrator = ck.data.service.PollingOrchestrator.getInstance();
  orchestrator.unregister(this);

  this.aggregateDependencies_ = [];
  this.emptyAggregateDependencies_ = [];
  this.serviceDependencies_ = [];
  this.removePopovers();
};

/**
 * @return {string}
 */
ck.views.ViewComponent.prototype.getComponentName = function () {
  return '';
};

/**
 * @private
 * @type {ck.data.service.ServiceRegistry}
 */
ck.views.ViewComponent.prototype.serviceRegistry_ = null;

/**
 * @private
 * @type {Array.<Array.<Object>>}
 */
ck.views.ViewComponent.prototype.aggregateDependencies_ = null;


/**
 * @private
 * @type {Array.<Array.<Object>>}
 */
ck.views.ViewComponent.prototype.emptyAggregateDependencies_ = null;

/**
 * @protected
 * @type {Array.<Array.<Object>>}
 */
ck.views.ViewComponent.prototype.serviceDependencies_ = null;

/**
 * @private
 * @type {goog.async.Deferred}
 */
ck.views.ViewComponent.prototype.dependencyRequire_ = null;

/**
 * @private
 * @type {Array.<goog.ui.Component>}
 */
ck.views.ViewComponent.prototype.behaviors_ = null;
