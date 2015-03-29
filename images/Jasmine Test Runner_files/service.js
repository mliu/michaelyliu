goog.provide('ck.data.service.Service');

/**
 * @interface
 */
ck.data.service.Service = function () {};

/**
 * Return a dependency from this service.  A dependency is anything required
 * by a service to load, e.g.
 *
 *   // return limits
 *   service.getDependency(ck.data.Limits)
 *   // return aggregate flavors
 *   service.getDependency(ck.data.servers.Flavors)
 *   // return flavors for a specific provider id
 *   service.getDependency(providerId, ck.data.servers.Flavors)
 */
ck.data.service.Service.prototype.getDependency = goog.nullFunction;

/**
 * Update a service's dependencies -- the first time it will load any data it
 * needs (e.g. images, flavors), repeated times it will load any data that may
 * change (only images).
 */
ck.data.service.Service.prototype.update = goog.nullFunction;

/**
 * @return {boolean}
 */
ck.data.service.Service.prototype.isLoaded = goog.nullFunction;

/**
 * @return {boolean}
 */
ck.data.service.Service.prototype.isError = goog.nullFunction;

/**
 * @return {boolean}
 */
ck.data.service.Service.prototype.isTimeout = goog.nullFunction;
