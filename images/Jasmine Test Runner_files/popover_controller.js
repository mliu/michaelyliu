goog.provide('ck.widgets.popovers.PopoverController');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('ck.widgets.popovers.CloseCommand');
goog.require('ck.widgets.popovers.FormDisplayer');
goog.require('ck.widgets.popovers.Displayer');

/**
 * Manages showing popovers based on certain events.
 * When an event is fired on this object, it determines from the configuration
 *  1) whether that event is relevant to this popover
 *  2) what popover to display
 *  3) what content to show within the popover frame
 *  4 - optional) what command to execute when 'save' is clicked
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {Object=} opt_config
 */
ck.widgets.popovers.PopoverController = function (opt_config) {
  goog.base(this);
  this.handler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.handler_);
  this.config_ = opt_config || {};
  this.tracker_ = ck.analytics.Tracker.getInstance();
};
goog.inherits(ck.widgets.popovers.PopoverController, goog.events.EventTarget);

/**
 * @protected
 * @type {goog.events.EventHandler}
 */
ck.widgets.popovers.PopoverController.prototype.handler_ = null;

/**
 * @private
 * @type {ck.analytics.Tracker}
 */
ck.widgets.popovers.PopoverController.prototype.tracker_ = null;

/**
 * @return {goog.events.EventHandler}
 */
ck.widgets.popovers.PopoverController.prototype.getHandler = function () {
  return this.handler_;
};

/**
 * Popover configuration
 * @private
 * @type {Object}
 */
ck.widgets.popovers.PopoverController.prototype.config_ = null;

/**
 * @param {*} type
 * @param {*} content
 * @param {*} command
 * @param {Object=} opt_data
 * @param {boolean=} opt_isModal
 */
ck.widgets.popovers.PopoverController.prototype.addPopover = function (type, content, command, opt_data, opt_isModal) {
  this.config_[type] = {
    content: content,
    command: command,
    data: opt_data,
    isModal: opt_isModal
  };
};

/**
 * @param {string} type                        What type of popover to display
 * @param {Element} target                     Where the popover points
 * @param {ck.widgets.Popover.Layout} layout   Which popover layout to use
 * @param {Object|null=} opt_model             What the popover is acting on
 * @param {Object|null=} opt_data              Additional data to pass to the popover
 */
ck.widgets.popovers.PopoverController.prototype.show = function (type, target, layout, opt_model, opt_data) {
  var displayer, content, command, config, model, data;

  model = opt_model || null;
  config = this.config_[type];
  displayer = this.getDisplayerForConfig_(config);
  if (goog.isBoolean(config.isModal)) {
    displayer.getPopover().setModal(config.isModal);
  }

  data = goog.object.clone(config.data);
  goog.object.extend(data, opt_data || {});

  if (config.command) {
    command = new config.command(model);
    this.registerDisposable(command);
    command.setData(data);
    command.setParentEventTarget(this);
    displayer.setCommand(command);
  }

  // Every content/form/command takes the model in the constructor.
  content = new config.content(model);
  this.registerDisposable(content);
  content.setParentEventTarget(this);

  // 'data' is any optional initialization information not passed into the
  // constructor.
  content.setData(data);

  displayer.setContent(content);
  displayer.setLayout(layout);
  displayer.setTarget(target);

  this.trackPopoverConversion_(command, content.getConversionEventId());

  this.registerDisposable(displayer);
  displayer.show();
};

/**
 * @private
 * @param {Object} config Popover displayer configuration
 * @return {ck.widgets.popovers.Displayer}
 */
ck.widgets.popovers.PopoverController.prototype.getDisplayerForConfig_ = function (config) {
  if (config.command) {
    return this.getFormDisplayer_();
  } else {
    return this.getDisplayer_();
  }
};

/**
 * Seam for testing.
 * @private
 * @return {ck.widgets.popovers.FormDisplayer}
 */
ck.widgets.popovers.PopoverController.prototype.getFormDisplayer_ = function (){
  return new ck.widgets.popovers.FormDisplayer();
};

/**
 * Seam for testing.
 * @private
 * @return {ck.widgets.popovers.Displayer}
 */
ck.widgets.popovers.PopoverController.prototype.getDisplayer_ = function () {
  return new ck.widgets.popovers.Displayer();
};

/**
 * Seam for testing.
 * @return {Object}
 */
ck.widgets.popovers.PopoverController.prototype.getConfig = function () {
  return this.config_;
};

/**
 * @private
 * @param {goog.events.EventTarget|null} command
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverController.prototype.trackPopoverConversion_ = function (command, conversionEventId) {
  if (command && !(command instanceof ck.widgets.popovers.CloseCommand)) {
    this.formPopoverConversionStarted_(conversionEventId);
    this.getHandler().listenOnce(
      command,
      ck.widgets.popovers.Command.EventType.COMPLETE,
      function () {
        this.formPopoverConversionSuccess_(conversionEventId);
      }
    );
  } else {
    this.viewOnlyPopoverConversionSuccess_(conversionEventId);
  }
};

/**
 * @private
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverController.prototype.formPopoverConversionStarted_ = function (conversionEventId) {
  this.tracker_.trackConversion(
    conversionEventId,
    ck.analytics.Tracker.ConversionActionType.CONVERSION_STARTED,
    ck.analytics.Tracker.ConversionCategory.POPOVER_FORM
  );
};

/**
 * @private
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverController.prototype.formPopoverConversionSuccess_ = function (conversionEventId) {
  this.tracker_.trackConversion(
    conversionEventId,
    ck.analytics.Tracker.ConversionActionType.CONVERSION_SUCCESS,
    ck.analytics.Tracker.ConversionCategory.POPOVER_FORM
  );
};

/**
 * @private
 * @param {string} conversionEventId
 */
ck.widgets.popovers.PopoverController.prototype.viewOnlyPopoverConversionSuccess_ = function (conversionEventId) {
  this.tracker_.trackConversion(
    conversionEventId,
    ck.analytics.Tracker.ConversionActionType.CONVERSION_SUCCESS,
    ck.analytics.Tracker.ConversionCategory.POPOVER_VIEWONLY
  );
};
