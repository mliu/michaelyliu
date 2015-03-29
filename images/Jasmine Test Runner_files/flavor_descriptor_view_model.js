goog.provide('ck.servers.widgets.FlavorDescriptorViewModel');

goog.require('ck.servers.widgets.FlavorViewModel');
goog.require('ck.widgets.UnderlineTooltip');

/**
 * @constructor
 * @extends {ck.servers.widgets.FlavorViewModel}
 * @param {ck.data.servers.Flavor} flavor
 */
ck.servers.widgets.FlavorDescriptorViewModel = function (flavor) {
  goog.base(this, flavor);

  this['cpuTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      return this.createUnderlineTooltip_(
        gettext("The number of virtual CPUs assigned to your Cloud Server. A vCPU corresponds to a physical CPU thread.")
      );
    }
  }, this);

  this['ramTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      return this.createUnderlineTooltip_(
        gettext("The amount of RAM reserved for your server. Cloud Servers are given a dedicated amount of RAM which is not shared with anyone else.")
      );
    }
  }, this);

  this['systemDiskTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      return this.createUnderlineTooltip_(
        gettext("The System Disk is the amount of hard drive space reserved for your Cloud Server's operating system and application data.  System Disks are partitioned automatically or manually when booting the Cloud Server.  All flavors have  their disks RAID-protected on the underlying infrastructure.")
      );
    }
  }, this);

  this['dataDiskTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      return this.createUnderlineTooltip_(
        gettext("The Data Disk is the amount of extra hard drive space reserved for your Cloud Server to store application data.   Data disks are not partitioned automatically and require manual partitioning after creation.  We recommend <strong>Cloud Backup</strong> for backing up data disks since creating an image does <strong>not</strong> save data from data disks.   All flavors have all of their disks RAID-protected on the underlying infrastructure.")
      );
    }
  }, this);

  this['networkTooltipText'] = ko.computed(function () {
    var percent;

    if (this['flavor']().isStandardFlavor()) {
      percent = gettext('50%');
    } else {
      percent = gettext('40%');
    }
    return goog.string.subs(
      gettext("The amount of aggregate outbound bandwidth across all attached networks (PublicNet, ServiceNet, Cloud Networks). Maximum outbound public bandwidth is limited to %s of the aggregate, while inbound traffic is not limited."),
      percent
    );
  }, this);


  this['networkTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      if (!this.networkTooltip_) {
        this.networkTooltip_ = new ck.widgets.UnderlineTooltip('');
        this.registerDisposable(this.networkTooltip_);
      }
      this.networkTooltip_.setHtml(this['networkTooltipText']());

      return this.networkTooltip_;
    }
  }, this);

  this['flavorDisplaysIo'] = ko.computed(function () {
    return !this['flavorOnMetal']();
  }, this);

  this['ioTooltip'] = ko.computed(function () {
    if (!this['flavorOnMetal']()) {
      return this.createUnderlineTooltip_(
        gettext("A comparison of the disk performance between various flavors.  Performance is based on the number of input/output operations per second (IOPS).")
      );
    }
  }, this);
};
goog.inherits(ck.servers.widgets.FlavorDescriptorViewModel, ck.servers.widgets.FlavorViewModel);

/**
 * @private
 * @param {string} html
 */
ck.servers.widgets.FlavorDescriptorViewModel.prototype.createUnderlineTooltip_ = function (html) {
  var tooltip;

  tooltip = new ck.widgets.UnderlineTooltip(html);
  this.registerDisposable(tooltip);

  return tooltip;
};

