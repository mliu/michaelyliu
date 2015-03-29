goog.provide('ck.views.PopoverControllerMixin');

goog.require('ck.widgets.popovers.PopoverController');
goog.require('ck.widgets.popovers.PopoverRegistrar');
goog.require('ck.widgets.popovers.PopoverTrigger');

ck.views.PopoverControllerMixin = function (){};

/**
 * @param {goog.events.EventTarget} instance
 * @param {ck.widgets.popovers.PopoverController=} opt_popoverController
 * @param {ck.widgets.popovers.PopoverTrigger=} opt_popoverTrigger
 */
ck.views.PopoverControllerMixin.extend = function (instance, opt_popoverController, opt_popoverTrigger) {
  instance.popoverController_ = opt_popoverController || new ck.widgets.popovers.PopoverController();
  instance.popoverController_.setParentEventTarget(instance);
  instance.registerDisposable(instance.popoverController_);

  instance.popoverTrigger_ = opt_popoverTrigger || new ck.widgets.popovers.PopoverTrigger(instance.popoverController_);
  instance.registerDisposable(instance.popoverTrigger_);
};

/**
 * @param {*} type
 * @param {*} content
 * @param {*=} opt_command
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.views.PopoverControllerMixin.prototype.hasPopover = function (type, content, opt_command) {
  var registrar;

  registrar = new ck.widgets.popovers.PopoverRegistrar(
    this.popoverController_,
    this.popoverTrigger_,
    type,
    content,
    opt_command
  );
  this.registerDisposable(registrar);

  return registrar;
};

ck.views.PopoverControllerMixin.prototype.removePopovers = function () {
  this.popoverTrigger_.removeAll();
};

/**
 * @return {ck.widgets.popovers.PopoverController}
 */
ck.views.PopoverControllerMixin.prototype.getPopoverController = function () {
  return this.popoverController_;
};