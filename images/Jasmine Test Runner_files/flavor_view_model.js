goog.provide('ck.servers.widgets.FlavorViewModel');

goog.require('ck.data.servers.Flavor');
goog.require('ck.format.DiskFormatter');
goog.require('ck.format.NetworkFormatter');
goog.require('ck.format.RAMFormatter');
goog.require('ck.templates.servers');
goog.require('ck.knockout.ViewModel');
goog.require('goog.string.StringBuffer');
goog.require('ck.widgets.UnderlineTooltip');

/**
 * @constructor
 * @param {ck.data.servers.Flavor} flavor
 * @extends {ck.knockout.ViewModel}
 */
ck.servers.widgets.FlavorViewModel = function (flavor) {
  var ramFormatter, diskFormatter, networkFormatter;

  goog.base(this);

  ramFormatter = new ck.format.RAMFormatter();
  diskFormatter = new ck.format.DiskFormatter();
  networkFormatter = new ck.format.NetworkFormatter();

  this['flavor'] = ko.observable(flavor);

  this['flavorOnMetal'] = ko.computed(function () {
    return this['flavor']().get('is_metal');
  }, this);

  this['flavorName'] = ko.computed(function () {
    if (this['flavorOnMetal']()) {
      return ck.data.servers.Flavor.MetalNames[this['flavor']().get('class')];
    }
    return this['flavor']().get('name');
  }, this);

  this['flavorCpu'] = ko.computed(function () {
    var count;

    count = this['flavor']().get('vcpus');

    if (this['flavorOnMetal']()) {
      return gettext('Dual 2.8 Ghz, 10 core Intel\u00ae Xeon\u00ae E5-2680 v2');
    }

    return goog.string.subs(
      ngettext('%s vCPU', '%s vCPUs', String(count)),
      count
    );
  }, this);

  this['flavorRam'] = ko.computed(function () {
    return ramFormatter.formatMegabytes(this['flavor']().get('ram'));
  }, this);

  this['flavorDisk'] = ko.computed(function () {
    return diskFormatter.formatGigabytes(this['flavor']().get('disk'));
  }, this);

  this['flavorHasDataDisks'] = ko.computed(function () {
    return this['flavor']().hasEphemeralDisk();
  }, this);

  this['flavorDataDisk'] = ko.computed(function () {
    var diskCount, diskCountString, diskSpaceString;

    if (this['flavor']().get('class') === ck.data.servers.Flavor.FlavorClass.METAL_IO) {
      return gettext('Dual 1.6 TB PCIe flash cards');
    }

    diskSpaceString = diskFormatter.formatGigabytes(
      this['flavor']().get('ephemeral_disk_space')
    );
    diskCountString = '';

    diskCount = this['flavor']().get('ephemeral_disk_num');
    if (diskCount > 1) {
      diskCountString = goog.getMsg(
        gettext(" ({$diskCount} disks)"),
        {'diskCount': diskCount}
      );
    }

    return goog.string.subs("%s%s", diskSpaceString, diskCountString);
  }, this);

  this['flavorRxtx'] = ko.computed(function () {
    if (this['flavorOnMetal']()) {
      return gettext('Redundant 10 Gb / s connections in a high availability bond');
    }
    return networkFormatter.formatMegabitsPerSecond(this['flavor']().get('rxtx_factor'));
  }, this);

  this['flavorDiskIo'] = ko.computed(function () {
    return this['flavor']().getIopsText();
  }, this);

  this['flavorDescription'] = ko.computed(function () {
    return this['flavor']().description();
  }, this);

  this['flavorPrice'] = ko.computed(function () {
    return this['flavor']().get('cost');
  }, this);

  this['flavorPriceIsUnavailable'] = ko.computed(function () {
    return (this['flavor']().get('cost') === 'Not Available');
  }, this);
};
goog.inherits(ck.servers.widgets.FlavorViewModel, ck.knockout.ViewModel);
