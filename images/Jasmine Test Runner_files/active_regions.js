goog.provide('ck.ActiveRegions');

goog.require('ck.data.regions.GlobalRegion');
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrIo');
goog.require('ck.UserAccount');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ck.ActiveRegions = function () {
  goog.base(this);
  this.currentRegions_ = goog.global['ACTIVE_REGIONS'] || [];
};
goog.inherits(ck.ActiveRegions, goog.events.EventTarget);
goog.addSingletonGetter(ck.ActiveRegions);

/**
 * @enum {string}
 */
ck.ActiveRegions.EventType = {
  REGIONS_UPDATED: goog.events.getUniqueId('REGIONS_UPDATED')
};

/**
 * @param {string} region
 * @return {boolean}
 */
ck.ActiveRegions.prototype.isRegionActive = function (region) {
  return goog.array.contains(this.getRegions(), region);
};

/**
 * @param {Array.<string>} regions
 */
ck.ActiveRegions.prototype.changeRegions = function(regions) {
  goog.net.XhrIo.send(
    goog.string.subs('%s/regions/set', ck.urls.Base),
    goog.nullFunction,
    'POST',
    goog.json.serialize({ 'regions': regions }),
    { 'X-CSRFToken': goog.global['_csrf_token'] },
    15000
  );

  this.currentRegions_ = regions;
  this.dispatchEvent(ck.ActiveRegions.EventType.REGIONS_UPDATED);
};

/**
 * @param {ck.data.Provider} provider
 */
ck.ActiveRegions.prototype.updateRegionsToIncludeProvider = function (provider) {
  var activeRegion, regionNode, commonRegion;

  activeRegion = this.getRegions()[0];
  regionNode = ck.data.regions.GlobalRegion.getInstance().find(activeRegion);

  try {
    commonRegion = regionNode.getCommonRegion(provider);
  } catch(TypeError) {
    throw new Error(goog.string.buildString('A region could not be inferred from the provider: ', provider.id()));
  }

  this.changeRegions([commonRegion]);
};

/**
 * @return {Array.<string>}
 */
ck.ActiveRegions.prototype.getRegions = function () {
  return this.currentRegions_;
};

/**
 * @return {Array.<string>}
 */
ck.ActiveRegions.prototype.getSubRegions = function () {
  var globalRegion;

  globalRegion = ck.data.regions.GlobalRegion.getInstance();

  return globalRegion.getSubRegions(this.getRegions());
};

/**
 * @private
 * @type {Array.<string>}
 */
ck.ActiveRegions.prototype.currentRegions_ = null;
