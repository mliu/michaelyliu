goog.require('ck.servers.widgets.FlavorDescriptorViewModel');

describe('ck.servers.widgets.FlavorDescriptorViewModel', function () {
  var viewModel, flavor;

  beforeEach(function () {
    flavor = new ck.data.servers.Flavor();
    spyOn(flavor, 'isStandardFlavor').andReturn(true);

    spyOn(ck.servers.widgets.FlavorDescriptorViewModel.prototype, 'registerDisposable').andCallThrough();
    viewModel = new ck.servers.widgets.FlavorDescriptorViewModel(flavor);
  });

  it('has a CPU tooltip', function () {
    expect(viewModel['cpuTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['cpuTooltip']().getHtml()).toBe(
      "The number of virtual CPUs assigned to your Cloud Server. A vCPU corresponds to a physical CPU thread."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['cpuTooltip']());
  });

  it('has a RAM tooltip', function () {
    expect(viewModel['ramTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['ramTooltip']().getHtml()).toBe(
      "The amount of RAM reserved for your server. Cloud Servers are given a dedicated amount of RAM which is not shared with anyone else."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['ramTooltip']());
  });

  it('has a system disk tooltip', function () {
    expect(viewModel['systemDiskTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['systemDiskTooltip']().getHtml()).toBe(
      "The System Disk is the amount of hard drive space reserved for your Cloud Server's operating system and application data.  System Disks are partitioned automatically or manually when booting the Cloud Server.  All flavors have  their disks RAID-protected on the underlying infrastructure."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['systemDiskTooltip']());
  });

  it('has a data disk tooltip', function () {
    expect(viewModel['dataDiskTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['dataDiskTooltip']().getHtml()).toBe(
      "The Data Disk is the amount of extra hard drive space reserved for your Cloud Server to store application data.   Data disks are not partitioned automatically and require manual partitioning after creation.  We recommend <strong>Cloud Backup</strong> for backing up data disks since creating an image does <strong>not</strong> save data from data disks.   All flavors have all of their disks RAID-protected on the underlying infrastructure."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['dataDiskTooltip']());
  });

  it('has an IO tooltip', function () {
    expect(viewModel['ioTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['ioTooltip']().getHtml()).toBe(
      "A comparison of the disk performance between various flavors.  Performance is based on the number of input/output operations per second (IOPS)."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['ioTooltip']());
  });

  it('has the correct network tooltip value on instantiation', function () {
    expect(viewModel['networkTooltip']()).toBeAnInstanceOf(ck.widgets.UnderlineTooltip);
    expect(viewModel['networkTooltip']().getHtml()).toBe(
      "The amount of aggregate outbound bandwidth across all attached networks (PublicNet, ServiceNet, Cloud Networks). Maximum outbound public bandwidth is limited to 50% of the aggregate, while inbound traffic is not limited."
    );
    expect(viewModel.registerDisposable).toHaveBeenCalledWith(viewModel['networkTooltip']());
  });

  it('flavorDisplaysIo is true for non-metal flavors', function () {
    expect(viewModel['flavorDisplaysIo']()).toBe(true);
  });

  it('flavorDisplaysIo is false for metal flavors', function () {
    var newFlavor;

    newFlavor = new ck.data.servers.Flavor();
    newFlavor.set('is_metal', true);

    viewModel['flavor'](newFlavor);

    expect(viewModel['flavorDisplaysIo']()).toBe(false);
  });

  describe('onMetal flavors', function () {

    beforeEach(function () {
      flavor.set('is_metal', true);
    });

    it('does not add a cpuTooltip', function () {
      expect(viewModel['cpuTooltip']()).toBe(undefined);
    });

    it('does not add a ramTooltip', function () {
      expect(viewModel['ramTooltip']()).toBe(undefined);
    });

    it('does not add a systemDiskTooltip', function () {
      expect(viewModel['systemDiskTooltip']()).toBe(undefined);
    });

    it('does not add a dataDiskTooltip', function () {
      expect(viewModel['dataDiskTooltip']()).toBe(undefined);
    });

    it('does not add a networkTooltip', function () {
      expect(viewModel['networkTooltip']()).toBe(undefined);
    });

    it('does not add a ioTooltip', function () {
      expect(viewModel['ioTooltip']()).toBe(undefined);
    });
  });

  describe('updating the network tooltip', function () {
    var standardFlavor, nonStandardFlavor;

    beforeEach(function () {
      standardFlavor = new ck.data.servers.Flavor();
      nonStandardFlavor = new ck.data.servers.Flavor();
      spyOn(standardFlavor, 'isStandardFlavor').andReturn(true);
      spyOn(nonStandardFlavor, 'isStandardFlavor').andReturn(false);
    });

    it('works when a Standard flavor is selected', function () {
      viewModel['flavor'](nonStandardFlavor);
      viewModel['flavor'](standardFlavor);

      expect(viewModel['networkTooltip']().getHtml()).toBe(
        "The amount of aggregate outbound bandwidth across all attached networks (PublicNet, ServiceNet, Cloud Networks). Maximum outbound public bandwidth is limited to 50% of the aggregate, while inbound traffic is not limited."
      );
    });

    it('works when a non-Standard flavor is selected', function () {
      viewModel['flavor'](nonStandardFlavor);

      expect(viewModel['networkTooltip']().getHtml()).toBe(
        "The amount of aggregate outbound bandwidth across all attached networks (PublicNet, ServiceNet, Cloud Networks). Maximum outbound public bandwidth is limited to 40% of the aggregate, while inbound traffic is not limited."
      );
    });
  });

});
