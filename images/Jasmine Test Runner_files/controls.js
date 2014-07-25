goog.provide('ck.widgets.forms.Controls');

goog.require('ck.buttons.Button');
goog.require('ck.templates.controls');
goog.require('goog.ui.Component');
goog.require('goog.dom.forms');

/**
 * @constructor
 * @extends {goog.ui.Component}
 * @param {goog.dom.DomHelper=} opt_domHelper
 */
ck.widgets.forms.Controls = function (opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(ck.widgets.forms.Controls, goog.ui.Component);

/**
 * @enum {string}
 */
ck.widgets.forms.Controls.ClassName = {
  SAVE: 'save',
  CANCEL: 'cancel',
  SECONDARY: 'secondary',
  ACTION_PENDING: 'action_pending',
  MESSAGE_CONTAINER: 'message_container',
  TIMEOUT_LINK: 'timeout_link',
  MESSAGE: 'message',
  ACTION_STARTED: 'action_started',
  ERROR: 'error',
  TIMEDOUT: 'timedout',
  FORM_CONTROLS: 'form_controls',
  INFORMATION: 'information'
};

/**
 * @enum {string}
 */
ck.widgets.forms.Controls.EventType = {
  TIMEOUT_ACKNOWLEDGED: 'timeout_acknowledged',
  SAVE_CLICK: 'save_click',
  SECONDARY_CLICK: 'secondary_click',
  CANCEL_CLICK: 'cancel_click'
};

/**
 * @const {string}
 */
ck.widgets.forms.Controls.TIMEOUT_TEXT = gettext('The operation did not complete in the expected amount of time.');

/**
 * @const {string}
 */
ck.widgets.forms.Controls.TIMEOUT_RETRY_TEXT = gettext('Try Again');

/** @inheritDoc */
ck.widgets.forms.Controls.prototype.createDom = function () {
  goog.base(this, 'createDom');
  this.getElement().innerHTML = ck.templates.controls.panel({
    labels: {
      save: gettext('Save'),
      cancel: gettext('Cancel')
    }
  });
};

/** @inheritDoc */
ck.widgets.forms.Controls.prototype.canDecorate = function (element) {

  var saveButton, cancelLink;

  saveButton = this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.SAVE, element);
  cancelLink = this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.CANCEL, element);

  return goog.isDefAndNotNull(saveButton) && goog.isDefAndNotNull(cancelLink);
};

/** @inheritDoc */
ck.widgets.forms.Controls.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  this.renderMessageTemplate_(element);
  this.renderThrobTemplate_(element);
};

/** @inheritDoc */
ck.widgets.forms.Controls.prototype.enterDocument = function () {
  goog.base(this, 'enterDocument');
  this.addFormsControlClass_();
  this.bindButtons();
  this.bindCancelLink_();
  this.bindTimeoutLink_();

  this.saveButton_ = new ck.buttons.Button(null);
  this.saveButton_.decorate(this.getSaveButtonElement());
  if (this.saveButtonEnabled_) {
    this.saveButton_.enable();
  } else {
    this.saveButton_.disable();
  }
};

/**
 * @private
 */
ck.widgets.forms.Controls.prototype.addFormsControlClass_ = function () {
  goog.dom.classes.add(this.getElement(),
    ck.widgets.forms.Controls.ClassName.FORM_CONTROLS);
};

/**
 * @private
 * @param {Element} element
 */
ck.widgets.forms.Controls.prototype.renderMessageTemplate_ = function(element) {

  var saveButton, domHelper, ClassName;

  domHelper = this.getDomHelper();
  ClassName = ck.widgets.forms.Controls.ClassName;

  if (domHelper.getElementByClass(ClassName.MESSAGE_CONTAINER, element)) {
    return;
  }

  saveButton = domHelper.getElementByClass(ClassName.SAVE, element);
  domHelper.insertSiblingBefore(domHelper.htmlToDocumentFragment(
    ck.templates.controls.message({})), saveButton);
};

/**
 * @private
 * @param {Element} element
 */
ck.widgets.forms.Controls.prototype.renderThrobTemplate_ = function(element) {

  var cancelLink, domHelper, ClassName;

  domHelper = this.getDomHelper();
  ClassName = ck.widgets.forms.Controls.ClassName;

  if (domHelper.getElementByClass(ClassName.ACTION_PENDING)) {
    return;
  }

  cancelLink = domHelper.getElementByClass(ClassName.CANCEL, element);
  domHelper.insertSiblingBefore(domHelper.htmlToDocumentFragment(
    ck.templates.controls.throb({})), cancelLink);
};

/**
 * @protected
 */
ck.widgets.forms.Controls.prototype.bindButtons = function() {

  var buttons;

  this.getHandler().listen(
    this.getSaveButtonElement(),
    goog.events.EventType.CLICK,
    function (e) {
      e.preventDefault();
      if (this.saveButtonEnabled_) {
        this.dispatchEvent(ck.widgets.forms.Controls.EventType.SAVE_CLICK);
      }
    }
  );

  buttons = this.getDomHelper().getElementsByTagNameAndClass('button',
    null, this.getElement());
  goog.array.forEach(buttons, function(button) {
    if(!goog.dom.classes.has(button, ck.widgets.forms.Controls.ClassName.SAVE)) {
      goog.dom.classes.add(button,
        ck.widgets.forms.Controls.ClassName.SECONDARY);
      this.bindElementToEvent_(button,
          ck.widgets.forms.Controls.EventType.SECONDARY_CLICK);
    }
  }, this);
};

/**
 * @private
 */
ck.widgets.forms.Controls.prototype.bindCancelLink_ = function() {
  this.bindElementToEvent_(this.getCancelLink(),
    ck.widgets.forms.Controls.EventType.CANCEL_CLICK);
};

/**
 * @private
 */
ck.widgets.forms.Controls.prototype.bindTimeoutLink_ = function() {
  this.bindElementToEvent_(this.getTimeoutLinkElement_(),
    ck.widgets.forms.Controls.EventType.TIMEOUT_ACKNOWLEDGED);
};

/**
 * @private
 * @param {Element} element
 * @param {ck.widgets.forms.Controls.EventType} eventType
 */
ck.widgets.forms.Controls.prototype.bindElementToEvent_ = function(element,
  eventType) {
  this.getHandler().listen(
    element,
    goog.events.EventType.CLICK,
    function(e) {
      e.preventDefault();
      this.dispatchEvent(eventType);
    }
  );
};

/**
 * @param {string} text
 * @param {boolean=} opt_beforeSave
 * @param {string=} opt_class
 */
ck.widgets.forms.Controls.prototype.addSecondaryButton = function (text, opt_beforeSave, opt_class) {
  var button, domHelper;

  domHelper = this.getDomHelper();
  button = domHelper.createDom(
    goog.dom.TagName.BUTTON,
    goog.string.trim(goog.string.subs('%s %s', ck.widgets.forms.Controls.ClassName.SECONDARY, opt_class || '')),
    text
  );

  if (opt_beforeSave) {
    domHelper.insertSiblingBefore(button, this.getSaveButtonElement());
  } else {
    domHelper.insertSiblingAfter(button, this.getSaveButtonElement());
  }
};

/**
 * Disables the save button.
 */
ck.widgets.forms.Controls.prototype.disableSaveButton = function () {
  if (this.isInDocument()) {
    this.saveButton_.disable();
  }
  this.saveButtonEnabled_ = false;
};

/**
 * Enables the save button.
 */
ck.widgets.forms.Controls.prototype.enableSaveButton = function () {
  if (this.isInDocument()) {
    this.saveButton_.enable();
  }
  this.saveButtonEnabled_ = true;
};

/**
 * Disables the secondary button.
 */
ck.widgets.forms.Controls.prototype.disableSecondaryButton = function () {
  goog.dom.forms.setDisabled(this.getSecondaryButton_(), true);
};

/**
 * Enables the secondary button.
 */
ck.widgets.forms.Controls.prototype.enableSecondaryButton = function () {
  goog.dom.forms.setDisabled(this.getSecondaryButton_(), false);
};

/**
 * Disables the buttons, hides cancel link
 */
ck.widgets.forms.Controls.prototype.startAction = function () {
  this.disableButtons_(true);
  this.clearMessage();
  this.removePreviousStatesAndAddCurrent_(
    ck.widgets.forms.Controls.ClassName.ACTION_STARTED);
};

/**
 * Enables the buttons, shows cancel link
 */
ck.widgets.forms.Controls.prototype.endAction = function () {
  this.disableButtons_(false);
  this.clearMessage();
  this.removePreviousStatesAndAddCurrent_('');
};

/**
 * @param {string} message
 */
ck.widgets.forms.Controls.prototype.error = function (message) {
  var doesNotMatchBlacklist;

  this.disableButtons_(false);
  this.clearMessage();

  doesNotMatchBlacklist = goog.array.every(
    ck.widgets.forms.Controls.ERROR_LOG_BLACKLIST,
    function (badSubstring) {
      return !goog.string.contains(message, badSubstring);
    }
  );

  if (doesNotMatchBlacklist) {
    ck.Logger.getInstance().error(
      'controls',
      goog.string.buildString('Displayed an error: ', message)
    );
  }

  this.getDomHelper().setTextContent(this.getMessageElement_(), message);
  this.removePreviousStatesAndAddCurrent_(
    ck.widgets.forms.Controls.ClassName.ERROR);
};

/**
 * Controls-widget error messages that we should not log.  These messages come
 * from the API and should be fixed on the API side, but we should not log them.
 * (e.g. "The supplied password 'kittens' is not a valid password.")
 * @const
 * @type {Array.<string>}
 */
ck.widgets.forms.Controls.ERROR_LOG_BLACKLIST = [
  'is not a valid password'
];

/**
 * @param {string} message
 * @param {string} linkText
 */
ck.widgets.forms.Controls.prototype.timeout = function (message, linkText) {

  var domHelper;

  domHelper = this.getDomHelper();
  this.clearMessage();

  ck.Logger.getInstance().error('controls', 'Displayed a timeout message');

  domHelper.setTextContent(this.getMessageElement_(), message);
  domHelper.setTextContent(this.getTimeoutLinkElement_(), linkText);
  this.removePreviousStatesAndAddCurrent_(
    ck.widgets.forms.Controls.ClassName.TIMEDOUT);
};

/**
 * @param {string} message
 */
ck.widgets.forms.Controls.prototype.showInformation = function (message) {
  this.disableButtons_(false);

  this.getDomHelper().setTextContent(this.getMessageElement_(), message);
  this.removePreviousStatesAndAddCurrent_(
    ck.widgets.forms.Controls.ClassName.INFORMATION);
};

/**
 * @param {string} text
 */
ck.widgets.forms.Controls.prototype.setSaveButtonText = function (text) {

  var saveButton;

  saveButton = this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.SAVE, this.getElement());
  this.getDomHelper().setTextContent(saveButton, text);
};

/**
 */
ck.widgets.forms.Controls.prototype.reset = function () {
  this.removePreviousStatesAndAddCurrent_('');
  this.enableSaveButton();
};

/**
 */
ck.widgets.forms.Controls.prototype.clearMessage = function() {

  var domHelper;

  domHelper = this.getDomHelper();
  domHelper.setTextContent(this.getMessageElement_(), "");
  domHelper.setTextContent(this.getTimeoutLinkElement_(), "");
};

/**
 * @private
 * @param {string} stateClass
 */
ck.widgets.forms.Controls.prototype.removePreviousStatesAndAddCurrent_ =
  function (stateClass) {

  var addClasses, removeClasses;

  addClasses = [stateClass];
  removeClasses = [
    ck.widgets.forms.Controls.ClassName.ACTION_STARTED,
    ck.widgets.forms.Controls.ClassName.TIMEDOUT,
    ck.widgets.forms.Controls.ClassName.ERROR,
    ck.widgets.forms.Controls.ClassName.INFORMATION
  ];

  goog.dom.classes.addRemove(this.getElement(), removeClasses, addClasses);
};

/**
 * @private
 * @param {boolean} disabled
 */
ck.widgets.forms.Controls.prototype.disableButtons_ = function (disabled) {

  var buttons;

  buttons = this.getElement().querySelectorAll(goog.dom.TagName.BUTTON);
  goog.array.forEach(buttons, function(button){
    goog.dom.forms.setDisabled(button, disabled);
  });
};

/**
 * @protected
 * @return {Element}
 */
ck.widgets.forms.Controls.prototype.getCancelLink = function() {
  return this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.CANCEL,
    this.getElement()
  );
};

/**
 * @return {Element}
 */
ck.widgets.forms.Controls.prototype.getSaveButtonElement = function() {
  return this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.SAVE,
    this.getElement()
  );
};

/**
 * @return {ck.buttons.Button}
 */
ck.widgets.forms.Controls.prototype.getSaveButton = function () {
  return this.saveButton_;
};

/**
 * @private
 * @return {Element}
 */
ck.widgets.forms.Controls.prototype.getSecondaryButton_ = function() {
  return this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.SECONDARY,
    this.getElement()
  );
};

/**
 * @private
 * @return {Element}
 */
ck.widgets.forms.Controls.prototype.getMessageElement_ = function() {
  return this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.MESSAGE,
    this.getElement()
  );
};

/**
 * @private
 * @return {Element}
 */
ck.widgets.forms.Controls.prototype.getTimeoutLinkElement_ = function() {
  return this.getDomHelper().getElementByClass(
    ck.widgets.forms.Controls.ClassName.TIMEOUT_LINK,
    this.getElement()
  );
};

/**
 * @private
 * @type {ck.buttons.Button}
 */
ck.widgets.forms.Controls.prototype.saveButton_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.Controls.prototype.saveButtonEnabled_ = true;

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.Controls.prototype.secondaryButtonEnabled_ = true;
