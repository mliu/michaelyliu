goog.provide('ck.data.regions.GlobalRegion');
goog.provide('ck.data.regions.Region');

goog.require('ck.UserAccount');
goog.require('goog.structs.TreeNode');
goog.require('goog.structs.Set');

/**
 * @constructor
 * @param {ck.data.Provider.Region} key
 * @param {ck.data.Provider.Region} value
 * @param {boolean} allowed
 * @extends {goog.structs.TreeNode}
 */
ck.data.regions.Region = function (key, value, allowed) {
  goog.base(this, key, value);

  this.setAllowed(allowed);
};
goog.inherits(ck.data.regions.Region, goog.structs.TreeNode);

/**
 * @param {ck.data.Provider} provider
 * @return {string}
 */
ck.data.regions.Region.prototype.getCommonRegion = function (provider) {
  var providerRegion, selectedRegionNode, commonAncestor, commonRegion;

  // We always want to consider staging provider as ALL.
  // Since, if there is a staging provider then there wont be any other providers

  if (provider.isStaging()) {
    return ck.data.Provider.Region.ALL;
  }

  if (provider.isFirstGenServers()) {
    if (!ck.UserAccount.isUk()) {
      providerRegion = ck.data.Provider.Region.US;
    } else {
      providerRegion = ck.data.Provider.Region.LON;
    }
  } else {
    providerRegion = /** @type {string} */(provider.get('serviceRegion'));
  }
  selectedRegionNode = this.getRoot().find(providerRegion);

  commonAncestor = goog.structs.TreeNode.findCommonAncestor(this, selectedRegionNode);
  commonRegion = /** @type {string} */(commonAncestor.getValue());

  return commonRegion;
};

/**
 * @return {Array.<ck.data.regions.Region>}
 */
ck.data.regions.Region.prototype.getSiblings = function () {
  var parent;

  parent = this.getParent();

  if (!parent) {
    return [];
  }

  return /** @type {Array.<ck.data.regions.Region>} */ (parent.getChildren());
};

/**
 * @param {string} key
 */
ck.data.regions.Region.prototype.find = function (key) {
  var subtreeRoot;

  subtreeRoot = null;
  this.traverse(function (node) {
    if (node.getKey() === key) {
      subtreeRoot = node;
    }
  });

  return subtreeRoot;
};

/**
 * @return {Array.<string>}
 */
ck.data.regions.Region.prototype.getAllEndRegionKeys = function () {
  var endRegion;

  endRegion = [];

  this.traverse(function (region) {
    if(region.isLeaf()) {
      endRegion.push(region.getKey());
    }
  });
  return endRegion;
};

/**
 * @param {boolean} allowed
 */
ck.data.regions.Region.prototype.setAllowed = function (allowed) {
  this.allowed_ = allowed;
};

/**
 * @return {boolean}
 */
ck.data.regions.Region.prototype.isAllowed = function () {
  return this.allowed_;
};

/**
 * @private
 * @type {boolean}
 */
ck.data.regions.Region.prototype.allowed_ = true;

/**
 * @constructor
 * @param {ck.data.Providers=} opt_providers
 * @extends {ck.data.regions.Region}
 */
ck.data.regions.GlobalRegion = function (opt_providers) {
  var us, eu, apac, isUk, allRegions, geoToNodeMap, allowed, providers;

  providers = opt_providers || ck.data.Providers.getInstance();
  isUk = ck.UserAccount.isUk();

  allRegions = goog.array.reduce(
    providers.map(function (provider) {
      return provider;
    }),
    function (set, provider) {
      var region;

      region = provider.get('serviceRegion');
      if (!goog.string.isEmptySafe(region)) {
        set.add(region);
      }

      return set;
    },
    new goog.structs.Set()
  );
  // Globally visible regions for all customers -- US and UK
  allRegions.addAll([
    ck.data.Provider.Region.DFW,
    ck.data.Provider.Region.ORD,
    ck.data.Provider.Region.IAD,
    ck.data.Provider.Region.SYD,
    ck.data.Provider.Region.LON
  ]);

  goog.base(this, ck.data.Provider.Region.ALL, ck.data.Provider.Region.ALL, true);

  us = new ck.data.regions.Region(ck.data.Provider.Region.US, ck.data.Provider.Region.US, !isUk);
  eu = new ck.data.regions.Region(ck.data.Provider.Region.EU, ck.data.Provider.Region.EU, isUk);
  apac = new ck.data.regions.Region(ck.data.Provider.Region.APAC, ck.data.Provider.Region.APAC, !isUk);

  geoToNodeMap = goog.object.create(
    ck.data.Provider.Region.US, us,
    ck.data.Provider.Region.EU, eu,
    ck.data.Provider.Region.APAC, apac
  );

  this.addChild(us);
  this.addChild(eu);
  this.addChild(apac);

  goog.array.forEach(allRegions.getValues(), function (region) {
    var matchingGeo, regionNode;

    matchingGeo = goog.object.findKey(
      ck.data.Provider.GeoRegionMap,
      function (regions) {
        return goog.array.contains(
          /** @type {Array.<string>} */ (regions),
          region
        );
      }
    );

    if (matchingGeo === ck.data.Provider.Region.EU) {
      allowed = isUk;
    } else {
      allowed = !isUk;
    }

    regionNode = new ck.data.regions.Region(region, region, allowed);

    if (!matchingGeo) {
      // If we don't have the map set up yet just add to the parent.  This is
      // dumb but safe.
      this.addChild(regionNode);
    } else {
      geoToNodeMap[matchingGeo].addChild(regionNode);
    }
  }, this);
};
goog.inherits(ck.data.regions.GlobalRegion, ck.data.regions.Region);
goog.addSingletonGetter(ck.data.regions.GlobalRegion);

/**
 * @param {Array.<string>} regions
 */
ck.data.regions.GlobalRegion.prototype.getSubRegions = function (regions) {
  var subRegions;

  subRegions = [];
  goog.array.forEach(regions, function (regionKey) {
    var region;

    if(regionKey === ck.data.Provider.Region.ALL) {
      subRegions = this.getAllEndRegionKeys();
    } else {
      region = this.find(regionKey);
      subRegions = goog.array.concat(subRegions, region.getAllEndRegionKeys());
    }
  }, this);

  return subRegions;
};
