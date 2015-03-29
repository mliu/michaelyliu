goog.provide('ck.data.servers.Flavor');
goog.provide('ck.data.servers.FlavorStore');

goog.require('ck.data.ProxyModel');
goog.require('ck.data.ProxyStore');
goog.require('ck.format.PriceFormatter');
goog.require('servo.Number');
goog.require('servo.Property');
goog.require('servo.String');
goog.require('ck.data.billing.Currency');

/**
 * @constructor
 * @extends {ck.data.ProxyStore}
 */
ck.data.servers.FlavorStore = function () {
  goog.base(this);
};
goog.inherits(ck.data.servers.FlavorStore, ck.data.ProxyStore);

/** @inheritDoc */
ck.data.servers.FlavorStore.prototype.getUrl = function () {
  return goog.string.buildString(goog.base(this, 'getUrl'), '/flavors');
};

/** @inheritDoc */
ck.data.servers.FlavorStore.prototype.parseInternal = function (opt_rawData) {
  var flavorData;

  if (goog.isArray(opt_rawData)) {
    return goog.base(this, 'parseInternal', opt_rawData);
  }

  opt_rawData = /** @type {!Object} */ (opt_rawData);
  flavorData = opt_rawData['flavor'];
  this.parseFlavor(flavorData);
  return goog.base(this, 'parseInternal', /** @type {!Object} */ (flavorData));
};

/** @protected */
ck.data.servers.FlavorStore.prototype.parseFlavor = function (flavorData) {
  var flavorId, flavorClass, extraSpecs;

  flavorId = flavorData['id'].toString();
  flavorData['id'] = flavorId;

  this.parseExtraSpecs_(flavorData);
};

/**
 * @protected
 * @param {Object} flavorData
 */
ck.data.servers.FlavorStore.prototype.parseExtraSpecs_ = function (flavorData) {
  var extraSpecs;

  extraSpecs = flavorData['OS-FLV-WITH-EXT-SPECS:extra_specs'];
  if (extraSpecs) {
    flavorData['ephemeral_disk_space'] = flavorData['OS-FLV-EXT-DATA:ephemeral'];
    flavorData['ephemeral_disk_num'] = Number(extraSpecs['number_of_data_disks']) || 0;
    flavorData['total_disk_space'] = flavorData['ephemeral_disk_space'] + flavorData['disk'];
    flavorData['class'] = extraSpecs['class'];
    if (flavorData['class'] === 'onmetal') {
      flavorData['is_metal'] = true;
      flavorData['class'] = ck.data.servers.Flavor.METAL_ID_TO_CLASS[flavorData['id']];
    }
    flavorData['iops'] = Number(extraSpecs['disk_io_index']);
  }
};

/**
 * @constructor
 * @param {Object=} opt_values
 * @extends {ck.data.ProxyModel}
 */
ck.data.servers.Flavor = ck.data.createProxyModel({
  'name': servo.createProperty(servo.String),
  'disk': servo.createProperty(servo.Number),
  'ram': servo.createProperty(servo.Number),
  'vcpus': servo.createProperty(servo.Number),
  'ephemeral_disk_space': servo.createProperty(servo.Number),
  'ephemeral_disk_num': servo.createProperty(servo.Number),
  'class': servo.createProperty(servo.String),
  'iops': servo.createProperty(servo.Number),
  'total_disk_space': servo.createProperty(servo.Number),
  // properties not populated from api
  'is_metal': servo.createProperty(servo.Boolean, false, false),
  'cost': servo.createProperty(servo.String),
  'rxtx_factor': servo.createProperty(servo.Number)
}, ck.data.servers.FlavorStore);

/**
 * @enum {string}
 */
ck.data.servers.Flavor.FlavorClass = {
  STANDARD: 'standard1',
  PERFORMANCE_ONE: 'performance1',
  PERFORMANCE_TWO: 'performance2',
  METAL_IO: 'metal_io',
  METAL_MEMORY: 'metal_memory',
  METAL_COMPUTE: 'metal_compute'
};

/**
 * @type {Object.<ck.data.servers.Flavor.FlavorClass, string>}
 */
ck.data.servers.Flavor.MetalNames = goog.object.create(
  ck.data.servers.Flavor.FlavorClass.METAL_IO, gettext('Optimized for Databases'),
  ck.data.servers.Flavor.FlavorClass.METAL_MEMORY, gettext('Optimized for Caching'),
  ck.data.servers.Flavor.FlavorClass.METAL_COMPUTE, gettext('Optimized for Web Servers')
);

/**
 * @type {Object.<string, ck.data.servers.Flavor.FlavorClass>}
 */
ck.data.servers.Flavor.METAL_ID_TO_CLASS = {
  'onmetal-io1': ck.data.servers.Flavor.FlavorClass.METAL_IO,
  'onmetal-compute1': ck.data.servers.Flavor.FlavorClass.METAL_COMPUTE,
  'onmetal-memory1': ck.data.servers.Flavor.FlavorClass.METAL_MEMORY
};

/**
 * @type {Object}
 */
ck.data.servers.Flavor.FlavorClassText = goog.object.create(
  ck.data.servers.Flavor.FlavorClass.STANDARD, gettext('Standard'),
  ck.data.servers.Flavor.FlavorClass.PERFORMANCE_ONE, gettext('Performance 1'),
  ck.data.servers.Flavor.FlavorClass.PERFORMANCE_TWO, gettext('Performance 2'),
  ck.data.servers.Flavor.FlavorClass.METAL_IO, gettext('OnMetal I/O'),
  ck.data.servers.Flavor.FlavorClass.METAL_MEMORY, gettext('OnMetal Memory'),
  ck.data.servers.Flavor.FlavorClass.METAL_COMPUTE, gettext('OnMetal Compute')
);

/**
 * @type {Object}
 */
ck.data.servers.Flavor.FlavorClassDescription = goog.object.create(
  ck.data.servers.Flavor.FlavorClass.STANDARD, gettext('Scale resources like CPU, memory, and storage depending on your needs. All storage is located on RAID 10-protected SATA hard disk drives.'),
  ck.data.servers.Flavor.FlavorClass.PERFORMANCE_ONE, gettext('Best suited for web servers, batch processing, network appliances, small databases, and most general-purpose computing workloads. Storage is high-performance, RAID 10-protected SSD.'),
  ck.data.servers.Flavor.FlavorClass.PERFORMANCE_TWO, gettext('Best for applications demanding high RAM, disk I/O, and consistent performance, such as large relational databases, NoSQL data stores, and distributed caches. Storage is RAID 10-protected SSD.'),
  ck.data.servers.Flavor.FlavorClass.METAL_IO, gettext('OnMetal I/O servers are designed to support low-latency and extreme throughput to local storage, using a pair of the fastest PCIe flash cards that money can buy.'),
  ck.data.servers.Flavor.FlavorClass.METAL_MEMORY, gettext('OnMetal Memory servers are designed for memory-intensive workloads such as Memcached or Redis.  512 GB servers and low-latency 10 Gb / s network enable modern architectures with the entire working set in RAM.'),
  ck.data.servers.Flavor.FlavorClass.METAL_COMPUTE, gettext('OnMetal Compute servers are designed for connection handling and CPU-heavy workloads such as web serving.  With high speeds, plenty of cores and a low latency 10 Gb / s network, OnMetal Compute is perfect for rendering web pages or pushing packets.')
);

/**
 * @const
 * @enum {number}
 */
ck.data.servers.Flavor.WINDOWS_CPU_COUNTS_FIRST_GEN = {
  '1024': 1,
  '2048': 2,
  '4096': 2,
  '8192': 4,
  '15872': 4,
  '30720': 8
};

/**
 * @const
 * @enum {number}
 */
ck.data.servers.Flavor.LINUX_CPU_COUNTS_FIRST_GEN = {
  '256': 4,
  '512': 4,
  '1024': 4,
  '2048': 4,
  '4096': 4,
  '8192': 4,
  '15872': 4,
  '30720': 8
};

/**
 * @return {boolean}
 */
ck.data.servers.Flavor.prototype.hasEphemeralDisk = function () {
  var isMetalIo;

  isMetalIo = (this.get('class') === ck.data.servers.Flavor.FlavorClass.METAL_IO);

  return isMetalIo || (this.get('ephemeral_disk_num') !== 0);
};

/**
 * @param {boolean} isWindows
 * @return {number}
 */
ck.data.servers.Flavor.prototype.getVCpuCount = function (isWindows) {
  var cpuCount, ram;

  cpuCount = /** @type {number} */ (this.get('vcpus'));

  if (cpuCount) {
    return cpuCount;
  }

  ram = this.get('ram').toString();

  if (isWindows) {
    cpuCount = ck.data.servers.Flavor.WINDOWS_CPU_COUNTS_FIRST_GEN[ram];
  } else {
    cpuCount = ck.data.servers.Flavor.LINUX_CPU_COUNTS_FIRST_GEN[ram];
  }

  return /** @type {number} */ (cpuCount || 1);
};

/**
 * @return {string}
 */
ck.data.servers.Flavor.prototype.getIopsText = function () {
  var iops, iopsText;

  iops = this.get('iops');
  if (iops >= 60) {
    iopsText = 'Best';
  } else if (iops >= 30) {
    iopsText = 'Better';
  } else {
    iopsText = 'Good';
  }

  return iopsText;
};

/**
 * @param {string} flavorId
 * @returns {string}
 */
ck.data.servers.Flavor.getFlavorClass = function (flavorId) {
  if (goog.string.startsWith(flavorId, 'performance1')) {
    return ck.data.servers.Flavor.FlavorClass.PERFORMANCE_ONE;
  } else if (goog.string.startsWith(flavorId, 'performance2')) {
    return ck.data.servers.Flavor.FlavorClass.PERFORMANCE_TWO;
  } else {
    return ck.data.servers.Flavor.FlavorClass.STANDARD;
  }
};

/**
 * @returns {string}
 */
ck.data.servers.Flavor.prototype.description = function () {
  return ck.data.servers.Flavor.FlavorClassDescription[this.get('class')] || '';
};

/**
 * returns {boolean}
 */
ck.data.servers.Flavor.prototype.isStandardFlavor = function () {
  return ck.data.servers.Flavor.getFlavorClass(this.get('class').toString()) === ck.data.servers.Flavor.FlavorClass.STANDARD;
};

/**
 * returns {boolean}
 */
ck.data.servers.Flavor.prototype.isPerformanceFlavor = function () {
  var flavorClass;
  flavorClass = this.get('class');

  return (flavorClass === ck.data.servers.Flavor.FlavorClass.PERFORMANCE_ONE ||
          flavorClass === ck.data.servers.Flavor.FlavorClass.PERFORMANCE_TWO);
};

/**
 * @param {ck.data.offerings.Offering} offering
 * @param {ck.data.billing.Currency} currency
 * @param {ck.data.servers.Image} image
 */
ck.data.servers.Flavor.prototype.updateCost = function (offering, currency, image) {
  var price, usageCost;

  if (offering) {
    usageCost = offering.getUsageCost(image, this);
    if (usageCost) {
      price = usageCost.getRegionPrice(this.getProvider().get('serviceRegion').toString());
      this.set('cost', currency.getCurrencyStringNoRound(price));
    }
  }
};

/**
 * @return {boolean}
 */
ck.data.servers.Flavor.prototype.canChangeDiskConfig = function () {
  return this.get('class') === ck.data.servers.Flavor.FlavorClass.STANDARD;
};
