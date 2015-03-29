goog.provide('ck.widgets.popovers.FormDisplayer');

goog.require('ck.View');
goog.require('ck.widgets.forms.Controls');
goog.require('ck.widgets.Popover');
goog.require('ck.widgets.popovers.Command');
goog.require('ck.widgets.popovers.Displayer');
goog.require('ck.widgets.forms.BoundForm');

/**
 * @constructor
 * @extends {ck.widgets.popovers.Displayer}
 * @param {ck.widgets.Popover=} opt_popoverWidget
 * @param {ck.widgets.forms.Controls=} opt_controls
 */
ck.widgets.popovers.FormDisplayer = function (opt_popoverWidget, opt_controls) {
  goog.base(this, opt_popoverWidget);

  this.controls_ = opt_controls || new ck.widgets.forms.Controls();
  if (!opt_controls) {
    this.registerDisposable(this.controls_);
  }
};
goog.inherits(ck.widgets.popovers.FormDisplayer, ck.widgets.popovers.Displayer);

/**
 * @private
 * @type {ck.widgets.forms.Controls}
 */
ck.widgets.popovers.FormDisplayer.prototype.controls_ = null;

/**
 * @protected
 * @return {ck.widgets.forms.Controls}
 */
ck.widgets.popovers.FormDisplayer.prototype.getControls = function () {
  return this.controls_;
};

/**
 * @private
 * @type {ck.widgets.popovers.Command}
 */
ck.widgets.popovers.FormDisplayer.prototype.command_ = null;

/**
 * @protected
 * @return {ck.widgets.popovers.Command}
 */
ck.widgets.popovers.FormDisplayer.prototype.getCommand = function () {
  return this.command_;
};

/**
 * @param {ck.widgets.popovers.Command} command
 */
ck.widgets.popovers.FormDisplayer.prototype.setCommand = function (command) {
  this.command_ = command;
  this.registerDisposable(this.command_);
};

ck.widgets.popovers.FormDisplayer.prototype.show = function () {
  var popover, popoverElement, saveCancel, inputs, controls;

  controls = this.getControls();
  this.getContent().setControls(controls);
  this.getContent().setCommand(this.getCommand());

  goog.base(this, 'show');

  this.getEventHandler().listen(
    controls,
    ck.widgets.forms.Controls.EventType.CANCEL_CLICK,
    this.hide);
};

/** @inheritDoc */
ck.widgets.popovers.FormDisplayer.prototype.configureContent = function () {
  var controls, popover, popoverElement, saveCancel, inputs;

  goog.base(this, 'configureContent');

  controls = this.getControls();
  popover = this.getPopover();
  popoverElement = popover.getElement();
  saveCancel = goog.dom.getElementByClass('save-cancel', popoverElement);
  if (saveCancel) {
    controls.decorate(saveCancel);
  }

  this.getContent().setCallback(/** @type {function (*):?} */
    (goog.bind(this.onSave_, this))
  );

  inputs = popoverElement.querySelectorAll('input');
  if (inputs.length > 0) {
    goog.dom.forms.focusAndSelect(inputs[0]);
  }
};

/**
 * @private
 * @param {Object} data
 */
ck.widgets.popovers.FormDisplayer.prototype.onSave_ = function (data) {
  var controls, command, popover;

  controls = this.getControls();
  command = this.getCommand();
  popover = this.getPopover();

  controls.startAction();
  popover.setAutoHide(false);

  this.getEventHandler().listenOnce(
    command,
    ck.widgets.popovers.Command.EventType.COMPLETE,
    this.hide
  );

  this.getEventHandler().listen(
    command,
    servo.events.EventType.ERROR,
    function (e) {
      popover.setAutoHide(true);

      if (goog.isFunction(e.getMessage)) {
        controls.error(e.getMessage());
      } else {
        controls.error(
          gettext('There was an error processing your request.')
        );
      }

      if (goog.isFunction(e.canRetry) && !e.canRetry()) {
        controls.disableSaveButton();
      }
    }
  );
  this.getEventHandler().listen(
    command,
    servo.events.EventType.TIMEOUT,
    function (e) {
      popover.setAutoHide(false);
      controls.timeout(
        'The operation did not complete in the expected amount of time.',
        'Close.'
      );
    }
  );
  this.getEventHandler().listen(
    controls,
    ck.widgets.forms.Controls.EventType.TIMEOUT_ACKNOWLEDGED,
    this.hide
  );

  command.execute(data);
};
