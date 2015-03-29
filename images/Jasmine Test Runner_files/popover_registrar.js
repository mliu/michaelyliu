goog.provide('ck.widgets.popovers.PopoverRegistrar');

goog.require('goog.Disposable');
goog.require('goog.events.EventTarget');
goog.require('ck.widgets.popovers.PopoverController');
goog.require('ck.widgets.popovers.PopoverTrigger');
goog.require('ck.widgets.popovers.Command');

/**
 * @constructor
 * @param {ck.widgets.popovers.PopoverController} controller
 * @param {ck.widgets.popovers.PopoverTrigger} trigger
 * @param {*} popoverType
 * @param {*} content
 * @param {*=} opt_command
 * @extends {goog.Disposable}
 */
ck.widgets.popovers.PopoverRegistrar = function (controller, trigger, popoverType, content, opt_command) {
  goog.base(this);
  this.controller_ = controller;
  this.popoverType_ = popoverType;
  this.content_ = content;
  this.popoverTrigger_ = trigger;
  this.registerDisposable(this.popoverTrigger_);

  if (opt_command) {
    this.command_ = opt_command;
  }
};
goog.inherits(ck.widgets.popovers.PopoverRegistrar, goog.Disposable);

/**
 * @param {string|Element} target
 * @param {string} layout
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.pointingTo = function (target, layout) {
  this.target_ = target;
  this.layout_ = layout;
  return this;
};

/**
 * @param {Object} model
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.withModel = function (model) {
  this.model_ = model;
  return this;
};

/**
 * @param {Object} data
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.withData = function (data) {
  this.data_ = data;
  return this;
};

/**
 * @param {boolean} isModal
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.isModal = function (isModal) {
  this.isModal_ = isModal;
  return this;
};

/**
 * @param {string} event
 * @param {goog.events.EventTarget|Element|string} source
 * @param {Object=} opt_data
 * @return {ck.widgets.popovers.PopoverRegistrar}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.on = function (event, source, opt_data) {
  var data;
  data = goog.isNull(this.data_) ? opt_data : this.data_;

  this.controller_.addPopover(this.popoverType_, this.content_, this.command_, data, this.isModal_);
  this.popoverTrigger_.triggerOn({
    events: {source: source, event: event},
    type: this.popoverType_,
    target: this.target_,
    layout: this.layout_,
    model: this.model_,
    data: data
  });
  return this;
};

/**
 * @private
 * @type {ck.widgets.popovers.PopoverTrigger}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.popoverTrigger_ = null;

/**
 * @private
 * @type {*}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.popoverType_ = '';

/**
 * @private
 * @type {*}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.content_ = null;

/**
 * @private
 * @type {*}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.command_ = null;

/**
 * @private
 * @type {string|Element}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.target_ = null;

/**
 * @private
 * @type {string|null}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.layout_ = null;

/**
 * @private
 * @type {Object|null}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.model_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.isModal_ = false;

/**
 * @private
 * @type {Object|null}
 */
ck.widgets.popovers.PopoverRegistrar.prototype.data_ = null;
