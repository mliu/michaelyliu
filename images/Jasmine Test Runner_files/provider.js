goog.provide('ck.data.Provider');
goog.provide('ck.data.Providers');
goog.provide('ck.data.ProvidersStore');
goog.provide('ck.data.Provider.Region');
goog.provide('ck.data.Provider.Geo');
goog.provide('ck.data.Provider.GeoRegionMap');

goog.require('ck.urls.providers');
goog.require('ck.UserAccount');
goog.require('servo.Collection');
goog.require('servo.JsonStore');
goog.require('servo.Model');
goog.require('servo.Store');
goog.require('servo.List');
goog.require('servo.Number');
goog.require('servo.Property');
goog.require('servo.String');
goog.require('servo.Boolean');
goog.require('goog.array');
goog.require('goog.object');
goog.require('ck.ActiveRegions');

/**
 * @constructor
 * @extends {servo.Model}
 */
ck.data.Provider = servo.createModel({
  'loaded': servo.createProperty(servo.Boolean),
  'url': servo.createProperty(servo.String),
  'serviceType': servo.createProperty(servo.String),
  'serviceName': servo.createProperty(servo.String),
  'serviceRegion': servo.createProperty(servo.String),
  'accessAllowed': servo.createProperty(servo.Boolean)
}, servo.Store);

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.isActive = function () {
  // Staging providers are always active.
  // Need for aggregateDependency so that we always fetch staging provider

  if (this.isStaging()) {
    return true;
  }

  if (!this.isAccessAllowed()) {
    return false;
  }

  return (this.hasNoRegion() || this.hasActiveRegion());
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.hasActiveRegion = function () {
  return goog.array.contains(
    ck.ActiveRegions.getInstance().getSubRegions(),
    this.get('serviceRegion')
  );
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.hasNoRegion = function () {
  return goog.string.isEmptySafe(this.get('serviceRegion'));
};

/**
 * @param {string} region
 * @return {string}
 */
ck.data.Provider.getLongRegion = function (region) {
  var name;

  name = goog.object.get(ck.data.Provider.regionToNameMap, region);
  if (name) {
    return /** @type {string} */ (name);
  }
  return '';
};

/**
 * @return {string}
 */
ck.data.Provider.prototype.getShortRegion = function () {
  var region;

  region = this.get('serviceRegion');

  if (region) {
    return /** @type {string} */ (region);
  }

  // Not great default behavior
  return '';
};

/**
 * @return {string}
 */
ck.data.Provider.prototype.getName = function () {
  var region, name;

  region = /** @type {string} */ (this.get('serviceRegion'));
  name = goog.object.get(ck.data.Provider.regionToNameMap, region);

  if (name) {
    return /** @type {string} */ (name);
  }
  return '';
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.isDefaultProvider = function() {
  return this.get('serviceRegion') === ck.UserAccount.defaultRegion();
};

/**
 * @const
 * @enum {string}
 */
ck.data.Provider.Region = {
  LON: 'LON',
  DFW: 'DFW',
  ORD: 'ORD',
  IAD: 'IAD',
  STAGING: 'STAGING',
  SYD: 'SYD',
  HKG: 'HKG',
  US: 'US',
  APAC: 'APAC',
  EU: 'EU',
  ALL: 'ALL'
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.isAccessAllowed = function () {
  return /** @type {boolean} */ (this.get('accessAllowed'));
};

/**
 * @type {Object.<string, string>}
 */
ck.data.Provider.regionToNameMap = goog.object.create(
  ck.data.Provider.Region.LON, gettext('London (LON)'),
  ck.data.Provider.Region.DFW, gettext('Dallas (DFW)'),
  ck.data.Provider.Region.ORD, gettext('Chicago (ORD)'),
  ck.data.Provider.Region.IAD, gettext('Northern Virginia (IAD)'),
  ck.data.Provider.Region.STAGING, gettext('Staging (STAGING)'),
  ck.data.Provider.Region.SYD, gettext('Sydney (SYD)'),
  ck.data.Provider.Region.HKG, gettext('Hong Kong (HKG)'),
  ck.data.Provider.Region.US, gettext('United States'),
  ck.data.Provider.Region.APAC, gettext('Asia-Pacific'),
  ck.data.Provider.Region.EU, gettext('Europe'),
  ck.data.Provider.Region.ALL, gettext('All Regions (Global)')
);

/**
 * @type {Object.<string, string>}
 */
ck.data.Provider.nameToRegionMap = goog.object.transpose(
  ck.data.Provider.regionToNameMap
);

/**
 * @const
 * @enum {string}
 */
ck.data.Provider.Geo = {
  US: 'US',
  APAC: 'APAC',
  EU: 'EU'
};

/**
 * @type {Object.<string, string>}
 */
ck.data.Provider.GeoNameMap = goog.object.create(
  ck.data.Provider.Geo.US, gettext('United States'),
  ck.data.Provider.Geo.APAC, gettext('Asia-Pacific'),
  ck.data.Provider.Geo.EU, gettext('Europe')
);

/**
 * @type {Object.<string, Array.<string>>}
 */
ck.data.Provider.GeoRegionMap = goog.object.create(
  ck.data.Provider.Geo.US, [ck.data.Provider.Region.ORD,
                            ck.data.Provider.Region.DFW,
                            ck.data.Provider.Region.IAD],
  ck.data.Provider.Geo.APAC, [ck.data.Provider.Region.SYD,
                              ck.data.Provider.Region.HKG],
  ck.data.Provider.Geo.EU, [ck.data.Provider.Region.LON]
);

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.isFirstGenServers = function () {
  var serviceType, serviceName;

  serviceType = this.get('serviceType');
  serviceName = this.get('serviceName');

  return (serviceType === ck.data.Providers.ServiceType.COMPUTE &&
          serviceName === ck.data.Providers.ServiceName.Compute.FIRSTGEN);
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.canManageServerNetworks = function () {
  if (ck.UserAccount.isRackConnect()) {
    // Managing the networks on a server breaks networking for RackConnect
    // users http://www.rackspace.com/knowledge_center/article/rackconnect-with-cloud-networks-faq
    return false;
  }
  if ((this.get('serviceType') !== ck.data.Providers.ServiceType.COMPUTE) ||
      (this.isFirstGenServers())) {
    return false;
  }

  return true;
};

/**
 * Returns the 'friendly name' for a provider, e.g. something that can be
 * shown to customers in the case of a load failure.
 *
 * @return {string}
 */
ck.data.Provider.prototype.getFriendlyName = function () {
  var name, region;

  if (this.isFirstGenServers()) {
    return 'First Generation Cloud Servers';
  }

  name = /** @type {string} */ (this.get('serviceName'));
  region = this.get('serviceRegion');

  if (region) {
    return goog.getMsg('{$serviceName} ({$serviceRegion})', {
      'serviceName': name,
      'serviceRegion': region
    });
  } else {
    return name;
  }
};

/**
 * @return {boolean}
 */
ck.data.Provider.prototype.isStaging = function () {
  return this.get('serviceRegion') === ck.data.Provider.Region.STAGING;
};

/**
 * @constructor
 * @extends {servo.JsonStore}
 */
ck.data.ProvidersStore = function () {
  goog.base(this);
  this.setUrl(ck.urls.Providers.get_all);
};
goog.inherits(
  ck.data.ProvidersStore,
  servo.JsonStore
);

/**
 * @param {Object=} opt_rawData
 */
ck.data.ProvidersStore.prototype.parseInternal = function (opt_rawData) {

  if (!opt_rawData) {
    return;
  }
  this.setParsedData(goog.array.map(
    /** @type {Array} */(opt_rawData),
    function (provider) {
      return {
        'id': provider['id'],
        'loaded': provider['last_updated'] !== null,
        'url': provider['url'],
        'serviceType': provider['service_catalog_type'] || '',
        'serviceName': provider['service_catalog_name'] || '',
        'serviceRegion': provider['service_catalog_region'] || '',
        'accessAllowed': this.userHasAccessToProvider_(provider)
      };
    },
    this
  ));
};

/**
 * @private
 * @param {Object} provider
 * @returns {boolean}
 */
ck.data.ProvidersStore.prototype.userHasAccessToProvider_ = function (provider) {
  if (provider['service_catalog_type'] === 'compute') {
    if (provider['service_catalog_name'] === 'cloudServers') {
      return ck.UserAccount.hasCapability(ck.capabilities.FirstGenServers.LIST_SERVERS);
    }
    return ck.UserAccount.hasCapability(ck.capabilities.NextGenServers.LIST_SERVERS);
  }
  return true;
};

/**
 * @constructor
 * @extends {servo.Collection}
 * @param {Object=} opt_values
 */
ck.data.Providers = servo.createCollection(
  ck.data.Provider,
  ck.data.ProvidersStore
);
goog.addSingletonGetter(ck.data.Providers);

/**
 * Load the providers collection from the PROVIDERS object rendered into the
 * template.
 */
ck.data.Providers.prototype.load = function () {
  this.getStore().parse(goog.global['PROVIDERS']);
  this.forEach(function (provider) {
    if (!provider.get('serviceType') ||
        !provider.get('serviceName')) {
      throw 'Corrupt provider without service type or name with id ' + provider.id();
    }
  });
};

(function () {
  var globalProviders;

  globalProviders = ck.data.Providers.getInstance();
  // certain pages do not define this, so we must be defensive
  if (goog.global['PROVIDERS']) {
    globalProviders.load();
  }
}());

/**
 * @param {string} type Service catalog type (rax:dns).
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.filterByServiceType = function (type) {
  return this.filter(function (provider) {
    return provider.get('serviceType') === type;
  });
};

/**
 * @param {string} type Service catalog type (rax:dns).
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.getAllowedByServiceType = function (type) {
  return goog.array.filter(this.filterByServiceType(type), function (provider) {
    return provider.isAccessAllowed();
  });
};

/**
 * @param {string} type Service catalog type (rax:dns).
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.findByServiceType = function (type) {
  return /** @type {ck.data.Provider} */(this.find(function (provider) {
    return provider.get('serviceType') === type;
  }));
};

/**
 * @param {string} type Service catalog type (rax:dns).
 * @param {string} name Service catalog name (cloudDNS).
 * @param {string} region (ORD).
 * @return {!Array}
 */
ck.data.Providers.prototype.filterByServiceTypeAndNameAndRegion = function (type, name, region) {
  return this.filter(function (provider) {
    return (provider.get('serviceType') === type &&
      provider.get('serviceName') === name &&
      provider.get('serviceRegion') === region);
  });
};

/**
 * @param {string} type Service catalog type (rax:dns).
 * @param {string} name Service catalog name (cloudDNS).
 * @return {!Array}
 */
ck.data.Providers.prototype.filterByServiceTypeAndName = function (type, name) {
  return this.filter(function (provider) {
    return (provider.get('serviceType') === type &&
      provider.get('serviceName') === name);
  });
};

/**
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getFirstGenServerProvider = function () {
  return this.getComputeProviders().filter(function (provider) {
    return provider.isFirstGenServers();
  })[0];
};

/**
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getTicketProvider = function () {
  return this.findByServiceType(ck.data.Providers.ServiceType.TICKETS);
};

/**
 * @return {boolean}
 */
ck.data.Providers.prototype.hasFirstGenServerProvider = function () {
  return goog.isDefAndNotNull(this.getFirstGenServerProvider());
};

/**
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.getNextGenServerProviders = function () {
  return this.getComputeProviders().filter(function (provider) {
    // staging and production have different service names so we just
    // check for not first-gen
    return !provider.isFirstGenServers();
  });
};

/**
 * @private
 * @param {string|ck.data.Provider} providerId
 * @param {string} serviceType
 * @param {string} serviceName
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getProviderInRegionOf_ = function (providerId, serviceType, serviceName) {
  var provider, filteredProviders;

  if (goog.isString(providerId)) {
    provider = this.getModelById(providerId);
  } else {
    provider = providerId;
  }

  if (!provider) {
    return null;
  }

  filteredProviders = this.filterByServiceTypeAndNameAndRegion(
    serviceType,
    serviceName,
    provider.get('serviceRegion')
  );

  return goog.array.isEmpty(filteredProviders) ? null : filteredProviders[0];
};

/**
 * @param {string|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getComputeProviderInRegionOf = function (providerId) {
  return this.getProviderInRegionOf_(
    providerId,
    ck.data.Providers.ServiceType.COMPUTE,
    ck.data.Providers.ServiceName.Compute.NEXTGEN
  );
};

/**
 * @return {boolean}
 */
ck.data.Providers.prototype.supportsTeeth = function () {
  var hasComputeIADProvider;

  hasComputeIADProvider = this.filterByServiceTypeAndNameAndRegion(ck.data.Providers.ServiceType.COMPUTE, ck.data.Providers.ServiceName.Compute.NEXTGEN, ck.data.Provider.Region.IAD);

  return ck.Features.hasTeeth() && !goog.array.isEmpty(hasComputeIADProvider);
};

/**
 * @param {string|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getLoadBalancerProviderInRegionOf = function (providerId) {
  return this.getProviderInRegionOf_(
    providerId,
    ck.data.Providers.ServiceType.LOADBALANCER,
    ck.data.Providers.ServiceName.LoadBalancer.LOADBALANCER
  );
};

/**
 * @param {string|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getAutoscaleProviderInRegionOf = function (providerId) {
  return this.getProviderInRegionOf_(
    providerId,
    ck.data.Providers.ServiceType.AUTOSCALE,
    ck.data.Providers.ServiceName.Autoscale.AUTOSCALE
  );
};

/**
 * @param {string|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getRackConnect3ProviderInRegionOf = function (providerId) {
  return this.getProviderInRegionOf_(
    providerId,
    ck.data.Providers.ServiceType.RACKCONNECTV3,
    ck.data.Providers.ServiceName.RackConnectV3.RACKCONNECTV3
  );
};

/**
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.getComputeProviders = function () {
  return this.filterByServiceType(ck.data.Providers.ServiceType.COMPUTE);
};

/**
 * @param {string|number|null|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.getComputeProviderInRegionOf = function (providerId) {
  return ck.data.Providers.getInstance().getComputeProviderInRegionOf(/** @type {string|ck.data.Provider} */ (providerId));
};

/**
 * @param {string|number|null|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.getLoadBalancerProviderInRegionOf = function (providerId) {
  return ck.data.Providers.getInstance().getLoadBalancerProviderInRegionOf(/** @type {string|ck.data.Provider} */ (providerId));
};

/**
 * @param {string|number|null|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.getBackupsProviderInRegionOf = function (providerId) {
  return ck.data.Providers.getInstance().getBackupsProviderInRegionOf(/** @type {string|ck.data.Provider} */ (providerId));
};

/**
 * @param {string} region
 * @return {ck.data.Provider}
 */
ck.data.Providers.getBackupsProviderInRegion = function (region) {
  return ck.data.Providers.getInstance().filterByServiceTypeAndNameAndRegion(
    ck.data.Providers.ServiceType.BACKUPS,
    ck.data.Providers.ServiceName.Backups.BACKUPS,
    region
  )[0];
};

/**
 * @param {string|ck.data.Provider} providerId
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getBackupsProviderInRegionOf = function (providerId) {
  return this.getProviderInRegionOf_(
    providerId,
    ck.data.Providers.ServiceType.BACKUPS,
    ck.data.Providers.ServiceName.Backups.BACKUPS
  );
};

 /**
  * @param {string|number|null|ck.data.Provider} providerId
  * @return {ck.data.Provider}
  */
 ck.data.Providers.getDatabaseProviderInRegionOf = function (providerId) {
   return ck.data.Providers.getInstance().getDatabaseProviderInRegionOf(/** @type {string|ck.data.Provider} */ (providerId));
 };

 /**
  * @param {string|ck.data.Provider} providerId
  * @return {ck.data.Provider}
  */
 ck.data.Providers.prototype.getDatabaseProviderInRegionOf = function (providerId) {
   return this.getProviderInRegionOf_(
     providerId,
     ck.data.Providers.ServiceType.DATABASE,
     ck.data.Providers.ServiceName.Database.DATABASE
   );
 };

 /**
  * @param {string|number|null|ck.data.Provider} providerId
  * @return {ck.data.Provider}
  */
 ck.data.Providers.getBlockstorageProviderInRegionOf = function (providerId) {
   return ck.data.Providers.getInstance().getBlockstorageProviderInRegionOf(/** @type {string|ck.data.Provider} */ (providerId));
 };

 /**
  * @param {string|ck.data.Provider} providerId
  * @return {ck.data.Provider}
  */
 ck.data.Providers.prototype.getBlockstorageProviderInRegionOf = function (providerId) {
   return this.getProviderInRegionOf_(
     providerId,
     ck.data.Providers.ServiceType.BLOCKSTORAGE,
     ck.data.Providers.ServiceName.Blockstorage.BLOCKSTORAGE
   );
 };

/**
 * @param {string} type
 * @param {string=} opt_name
 * @return {ck.data.Provider}
 */
ck.data.Providers.prototype.getDefaultProvider = function(type, opt_name) {
  var providers, defaultProvider;

  if (opt_name) {
    providers = this.filterByServiceTypeAndName(type, opt_name);
  } else {
    providers = this.filterByServiceType(type);
  }

  defaultProvider = goog.array.find(providers, function (provider) {
    return provider.isDefaultProvider();
  });

  if (!defaultProvider) {
    defaultProvider = providers[0];
  }

  return /** @type {ck.data.Provider} */(defaultProvider);
};

/**
 * @param {string} serviceType
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.getActiveProvidersForServiceType = function (serviceType) {
  var serviceProviders;

  serviceProviders = this.filterByServiceType(serviceType);

  return goog.array.filter(serviceProviders, function (provider) {
    return provider.hasActiveRegion();
  });
};

/**
 * @param {string} serviceType
 * @return {Array.<ck.data.Provider>}
 */
ck.data.Providers.prototype.getActiveAllowedProvidersForServiceType = function (serviceType) {
  var activeProviders;

  activeProviders = this.getActiveProvidersForServiceType(serviceType);

  return goog.array.filter(activeProviders, function (provider) {
    return provider.isAccessAllowed();
  });
};

/**
 * @param {string} type Service catalog type (rax:dns).
 * @param {string} region (ORD).
 * @return {!Array}
 */
ck.data.Providers.prototype.filterByServiceTypeAndRegion = function (type, region) {
  return this.filter(function (provider) {
    return (provider.get('serviceType') === type &&
      provider.get('serviceRegion') === region);
  });
};

/**
 * @param {string} serviceType
 * @return {ck.data.Provider}
 */
ck.data.Providers.getDefaultActiveAllowedProvider = function (serviceType) {
  var providers, defaultProvider, activeAllowedProviders;

  providers = ck.data.Providers.getInstance();
  defaultProvider = providers.getDefaultProvider(serviceType);
  activeAllowedProviders = providers.getActiveAllowedProvidersForServiceType(serviceType);

  if (goog.array.contains(activeAllowedProviders, defaultProvider)) {
    return defaultProvider;
  }

  if (!goog.array.isEmpty(activeAllowedProviders)) {
    return activeAllowedProviders[0];
  }

  if (defaultProvider.isAccessAllowed()) {
    return defaultProvider;
  }

  return providers.getAllowedByServiceType(serviceType)[0];
};

/**
 * @const
 * @enum {string}
 */
ck.data.Providers.ServiceType = {
  COMPUTE: 'compute',
  DATABASE: 'rax:database',
  LOADBALANCER: 'rax:load-balancer',
  DNS: 'rax:dns',
  MONITORING: 'rax:monitor',
  DEPLOYMENTS: 'rax:deployments',
  BLUEPRINTS: 'rax:blueprints',
  AUTOSCALE: 'rax:autoscale',
  FILES_CDN: 'rax:object-cdn',
  FILES: 'object-store',
  BLOCKSTORAGE: 'volume',
  BILLING: 'rax:billing',
  SUPPORT: 'rax:support',
  INCIDENT: 'rax:incident',
  TICKETS: 'rax:tickets',
  CUSTOMER: 'rax:customer',
  OFFERINGS: 'rax:offerings',
  PAYMENT_USER: 'rax:paymentUser',
  IDENTITY: 'identity',
  QUEUES: 'rax:queues',
  BIGDATA: 'rax:bigdata',
  BACKUPS: 'rax:backup',
  ORCHESTRATION: 'orchestration',
  RACKCONNECTV3: 'rax:rackconnect'
};

ck.data.Providers.ServiceTypeProductName = goog.object.create(
  ck.data.Providers.ServiceType.DATABASE, 'Cloud Databases',
  ck.data.Providers.ServiceType.AUTOSCALE, 'Auto Scale',
  ck.data.Providers.ServiceType.BIGDATA, 'Big Data'
);

/**
 * @const
 * @enum {Object.<string,string>}
 */
ck.data.Providers.ServiceName = {
  Compute: {
    FIRSTGEN: 'cloudServers',
    NEXTGEN: 'cloudServersOpenStack',
    NEXTGEN_STAGING: 'cloudServersPreprod'
  },
  LoadBalancer: {
    LOADBALANCER: 'cloudLoadBalancers'
  },
  Autoscale: {
    AUTOSCALE: 'autoscale'
  },
  Backups: {
    BACKUPS: 'cloudBackup'
  },
  Database: {
    DATABASE: 'cloudDatabases'
  },
  Blockstorage: {
    BLOCKSTORAGE: 'cloudBlockStorage'
  },
  RackConnectV3: {
    RACKCONNECTV3: 'rackconnect'
  }
};

/**
 * @const
 * @enum {Object.<string,string>}
 */
ck.data.Providers.ServiceIds = {
  Compute: {
    FIRSTGEN: goog.string.subs('%s,%s', ck.data.Providers.ServiceType.COMPUTE, ck.data.Providers.ServiceName.Compute.FIRSTGEN)
  }
};

/** @inheritDoc */
ck.data.Providers.prototype.disposeInternal = function () {
  if (this === ck.data.Providers.getInstance()) {
    // no disposing of the global object
  } else {
    goog.base(this, 'disposeInternal');
  }
};
