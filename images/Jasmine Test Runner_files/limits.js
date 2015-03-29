goog.provide('ck.data.Limits');
goog.provide('ck.data.LimitsStore');

goog.require('servo.Dictionary');
goog.require('servo.Property');
goog.require('servo.String');
goog.require('ck.data.AbsoluteLimit');
goog.require('ck.data.ProxyModel');
goog.require('ck.data.RackspaceStore');
goog.require('ck.data.RateLimit');

/**
 * @constructor
 * @extends {ck.data.RackspaceStore}
 */
ck.data.LimitsStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.LimitsStore, ck.data.RackspaceStore);

/** @inheritDoc */
ck.data.LimitsStore.prototype.getUrl = function () {
  return goog.string.buildString(goog.base(this, 'getUrl'), '/limits');
};

/** @inheritDoc */
ck.data.LimitsStore.prototype.fetchInternal = function (opt_args) {
  var args;

  args = {};

  if (this.shouldCacheBust_()) {
    args['cache-busting'] = this.getCacheBustingValue_();
  }

  goog.base(this, 'fetchInternal', args);
};

/**
 * @private
 * @return {number}
 */
ck.data.LimitsStore.prototype.getCacheBustingValue_ = function () {
  return (new Date()).getTime();
};

/**
 * @private
 * @return {boolean}
 */
ck.data.LimitsStore.prototype.shouldCacheBust_ = function () {
  return this.getProviderId() === ck.data.Providers.ServiceIds.Compute.FIRSTGEN;
};

/** @inheritDoc */
ck.data.LimitsStore.prototype.parseInternal = function (opt_rawData) {
  var limitsData;

  opt_rawData = /** @type {!Object} */ (opt_rawData);
  limitsData = /** @type {!Object} */ (goog.object.get(opt_rawData, 'limits'));

  this.setBuildRegion_(limitsData);
  this.parseAbsoluteLimits_(limitsData);
  this.parseRateLimits_(limitsData);

  goog.base(this, 'parseInternal', limitsData);
};

/**
 * QE users do not have a build region set. This may also be true for customer
 * accounts, so we set an empty build region if it was not returned by the API.
 * @private
 * @param {Object} limits
 */
ck.data.LimitsStore.prototype.setBuildRegion_ = function (limits) {
  if (!goog.object.get(limits, 'buildRegion')) {
    goog.object.set(limits, 'buildRegion', '');
  }
};

/**
 * @private
 * @param {Object} limits
 */
ck.data.LimitsStore.prototype.parseAbsoluteLimits_ = function (limits) {
  var parsedAbsoluteLimits, rawAbsoluteLimits;

  parsedAbsoluteLimits = [];
  rawAbsoluteLimits = limits['absolute'] || {};

  goog.object.forEach(rawAbsoluteLimits, function (limit, id) {
    if (goog.isNumber(limit)) {
      parsedAbsoluteLimits.push({ id: id, 'limit': limit });
    } else {
      parsedAbsoluteLimits.push({ id: id, 'limit': parseInt(limit['limit'], 10), 'remaining': parseInt(limit['remaining'], 10) });
    }
  }, this);

  limits['absolute'] = parsedAbsoluteLimits;
};

/**
 * @private
 * @param {Object} limits
 */
ck.data.LimitsStore.prototype.parseRateLimits_ = function (limits) {
  var parsedRateLimits, rateLimitedUris;

  parsedRateLimits = [];
  rateLimitedUris = limits['rate'] || [];

  goog.array.forEach(rateLimitedUris, function (uri) {
    var limits;

    limits = uri['limit'];
    goog.object.remove(uri, 'limit');

    // Rate limits for the first-generation endpoint are returned in a
    // different format that next-generation endpoints. This condition
    // handles parsing for the first-generation endpoint.
    if (!goog.isArray(limits)) {
      parsedRateLimits.push(uri);
      return;
    }

    goog.array.forEach(limits, function (limit) {
      goog.object.extend(limit, uri);
      parsedRateLimits.push(limit);
    });
  });

  limits['rate'] = parsedRateLimits;
};

/** @inheritDoc */
ck.data.LimitsStore.prototype.getTimeoutThreshold = function (method) {
  // limits calls are slow in staging
  return 30000;
};

/**
 * @constructor
 * @extends {ck.data.ProxyModel}
 */
ck.data.Limits = ck.data.createProxyModel({
  // Only returned for first-gen compute limits.
  'buildRegion': servo.createProperty(servo.String),
  'absolute': servo.createCollection(ck.data.AbsoluteLimit, servo.Store),
  'rate': servo.createCollection(ck.data.RateLimit, servo.Store)
}, ck.data.LimitsStore);

/**
 * @param {string} key
 * @return {*} value
 */
ck.data.Limits.prototype.getAbsoluteLimit = function (key) {
  var limit;

  limit = this.getPropertyByKey('absolute').getModelById(key);
  if (limit) {
    return limit.get('limit');
  }

  return null;
};

/**
 * @param {string} key
 * @return {*} value
 */
ck.data.Limits.prototype.getRemainingLimit = function (key) {
  var limit;

  limit = this.getPropertyByKey('absolute').getModelById(key);
  if (limit) {
    return limit.get('remaining');
  }

  return null;
};

/** @inheritDoc */
ck.data.Limits.prototype.shouldAlwaysFetch = function () {
  return this.getProvider().get('serviceType') === ck.data.Providers.ServiceType.BIGDATA;
};

/**
 * @return {number}
 */
ck.data.Limits.prototype.getAvailableRam = function () {
  var maxRam, usedRam;

  maxRam = /** @type {number} */(this.getAbsoluteLimit('maxTotalRAMSize'));
  usedRam = /** @type {number} */(this.getAbsoluteLimit('totalRAMUsed'));

  return maxRam - usedRam;
};

/**
 * @return {boolean}
 */
ck.data.Limits.prototype.hasServersOrRAMInRegion = function () {
  var instances, ram;

  instances = /** @type {number} */ (this.getAbsoluteLimit('totalInstancesUsed') || 0);
  ram = /** @type {number} */(this.getAbsoluteLimit('totalRAMUsed') || 0);

  return instances > 0 || ram > 0;
};

/**
 * @return {boolean}
 */
ck.data.Limits.prototype.canUsePrivateNetworks = function () {
  var maxNetworks;

  if (this.getProvider().isFirstGenServers()) {
    return false;
  }

  maxNetworks = /** @type {number} */ (this.getAbsoluteLimit('maxTotalPrivateNetworks'));
  return maxNetworks > 0;
};

/**
 * @return {boolean}
 */
ck.data.Limits.prototype.isOverPrivateNetworksLimit = function () {
  var maxTotalPrivateNetworks, usedPrivateNetworks;

  if (!this.canUsePrivateNetworks()) {
    return true;
  }

  maxTotalPrivateNetworks = this.getAbsoluteLimit('maxTotalPrivateNetworks');
  usedPrivateNetworks = this.getAbsoluteLimit('totalPrivateNetworksUsed');

  return usedPrivateNetworks >= maxTotalPrivateNetworks;
};

/**
 * @param {string} uri
 * @param {string} verb
 * @return {boolean}
 */
ck.data.Limits.prototype.isOverRateLimit = function (uri, verb) {

  var rateLimit;

  rateLimit = this.getPropertyByKey('rate').find(function (rateLimit) {

    var isMatchingUri, isMatchingVerb;

    isMatchingUri = rateLimit.get('uri') === uri;
    isMatchingVerb = rateLimit.get('verb') === verb;
    return isMatchingUri && isMatchingVerb;
  });

  return goog.isDefAndNotNull(rateLimit) && (rateLimit.get('remaining') === 0);
};

/**
 * @return {boolean}
 */
ck.data.Limits.prototype.haveRemainingNodes = function () {
  var nodeLimit;

  nodeLimit = this.getPropertyByKey('absolute').getModelById('nodeCount');
  return nodeLimit.get('remaining') > 0;
};

/**
 * @enum{number}
 */
ck.data.Limits.warningThresholds = {
  SERVERS: 80,
  SERVERS_RAM: 80
};
