goog.provide('ck.widgets.forms.BoundInput');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.Component');
goog.require('goog.dom');
goog.require('ck.utility.FileInput');
goog.require('ck.templates.field_validation');

/**
 * @constructor
 * @extends {goog.ui.Component}
 * @param {goog.dom.DomHelper=} opt_domHelper
 * @param {boolean=} opt_useCanonValidation
 */
ck.widgets.forms.BoundInput = function(opt_domHelper, opt_useCanonValidation) {
  goog.base(this, opt_domHelper);
  this.validators_ = {};
  this.isValid_ = true;
  this.useCanonValidation_ = opt_useCanonValidation || false;
};
goog.inherits(ck.widgets.forms.BoundInput, goog.ui.Component);

/**
 * @enum {string}
 */
ck.widgets.forms.BoundInput.className = {
  ERROR: 'error',
  FIXED: 'fixed',
  ICON: 'icon',
  MESSAGE_TEXT: 'message-text',
  SECTION: 'message'
};

/**
 * @private
 * @type {Object}
 */
ck.widgets.forms.BoundInput.prototype.validators_ = null;

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.BoundInput.prototype.isValid_ = true;

/**
 * @param {ck.validators.Validator} validator
 * @param {string} eventType
 */
ck.widgets.forms.BoundInput.prototype.addValidator = function(validator,
  eventType) {

  var validatorsForEvent;

  validatorsForEvent = this.validators_[eventType] || [];
  validatorsForEvent.push(validator);
  this.validators_[eventType] = validatorsForEvent;
};

/**
 * @return {Object}
 */
ck.widgets.forms.BoundInput.prototype.getValidators = function() {
  return this.validators_;
};

/**
 * @return {*}
 */
ck.widgets.forms.BoundInput.prototype.getValue = function() {
  var element, radioElement, value, checkboxes, isCheckboxGroup;

  element = this.getElement();

  radioElement = this.getCheckedRadioInput_();
  if (radioElement) {
    return radioElement.value;
  }

  if (element.type === 'file') {
    return ck.utility.FileInput.getFileFromElement(element);
  }

  if ((element.type === 'checkbox') && !element.checked) {
    return null;
  }

  checkboxes = element.querySelectorAll('input[type="checkbox"]');
  isCheckboxGroup = checkboxes.length > 0;
  if (isCheckboxGroup) {
    value = [];
    goog.array.forEach(checkboxes, function (checkbox) {
      if (checkbox.checked) {
        value.push(checkbox.value);
      }
    });
    return value;
  }

  value = element.value;
  if (value === undefined) {
    return null;
  }

  return value;
};

/**
 * @private
 * @return {Element?}
 */
ck.widgets.forms.BoundInput.prototype.getCheckedRadioInput_ = function () {
  var radioInputs;

  radioInputs = this.getElement().querySelectorAll('input[type="radio"]');
  return /** @type {Element} */ (goog.array.find(radioInputs, function (radioInput) {
    return radioInput.checked;
  }));
};

/**
 * @param {*} value
 */
ck.widgets.forms.BoundInput.prototype.setValue = function(value) {
  this.getElement().value = value;
};

/** @inheritDoc */
ck.widgets.forms.BoundInput.prototype.enterDocument = function() {

  var element, handler, result, errorMessage;

  element = this.getElement();
  handler = this.getHandler();
  goog.object.forEach(this.validators_, function(validators, eventType) {
    handler.listen(element, eventType, function(e) {
      this.runValidations_(eventType);
    });
  });
};

/**
 * @param {ck.widgets.forms.BoundInput} input
 * Runs this input's validators when events happen on the specified input.
 */
ck.widgets.forms.BoundInput.prototype.makeComputedFrom = function (input) {
  goog.object.forEach(this.validators_, function (validators, eventType) {
    input.getHandler().listen(input.getElement(), eventType, function (e) {
      this.runValidations_(eventType);
    }, undefined, this);
  }, this);
};

/**
 */
ck.widgets.forms.BoundInput.prototype.runAllValidations = function () {
  this.runValidations_();
};

/**
 * @private
 * @param {string=} optEventType
 */
ck.widgets.forms.BoundInput.prototype.runValidations_ =
  function (optEventType) {

  var element, validators, results, failure, errorMessage, resolvedMessage,
    parent, existingMessage;

  element = this.getElement();
  validators = optEventType ?
    this.validators_[optEventType] : goog.object.getValues(this.validators_);
  validators = goog.array.flatten(validators);

  if (validators.length === 0) {
    return;
  }

  results = goog.array.map(validators, function(validator) {
    return validator.validate(this.getValue());
  }, this);
  failure = goog.array.find(results, function(result) {
    return !result.isValid();
  });

  if (failure) {
    this.isValid_ = false;

    existingMessage = this.getErrorMessage_();
    errorMessage = this.createErrorDom_(/**@type {string}*/ (failure.getMessage()));

    goog.dom.classes.add(element.parentNode,
      ck.widgets.forms.BoundInput.className.ERROR);
    this.handleLabelError_(true);
    goog.dom.classes.remove(element.parentNode,
      ck.widgets.forms.BoundInput.className.FIXED);

    goog.dom.removeNode(existingMessage);
    goog.dom.appendChild(element.parentNode, errorMessage);
  }
  else {
    errorMessage = this.getErrorMessage_();
    goog.dom.classes.remove(element.parentNode,
      ck.widgets.forms.BoundInput.className.ERROR);
    this.handleLabelError_(false);
    goog.dom.removeNode(errorMessage);

    if (!this.isValid_) {
      resolvedMessage = this.createBlankMessageDom_();
      goog.dom.classes.add(element.parentNode,
        ck.widgets.forms.BoundInput.className.FIXED);
      goog.dom.appendChild(element.parentNode, resolvedMessage);
    }

    this.isValid_ = true;
  }
};

/**
 * @private
 * @return {Node}
 */
ck.widgets.forms.BoundInput.prototype.createBlankMessageDom_ = function () {
  if (this.useCanonValidation_) {
    return goog.dom.htmlToDocumentFragment(ck.templates.field_validation.blank_message_canon());
  }

  return goog.dom.htmlToDocumentFragment(
    ck.templates.field_validation.blank_message()
  );
};

/**
 * @private
 * @param {string} message
 * @return {Node}
 */
ck.widgets.forms.BoundInput.prototype.createErrorDom_ = function (message) {
  if (this.useCanonValidation_) {
    return goog.dom.htmlToDocumentFragment(ck.templates.field_validation.error_message_canon({ message: message }));
  }

  return goog.dom.htmlToDocumentFragment(
    ck.templates.field_validation.error_message({message: message})
  );
};

/**
 * @private
 * @param {boolean} add
 */
ck.widgets.forms.BoundInput.prototype.handleLabelError_ = function(add) {

  var grandParent, element, label;

  element = this.getElement();
  grandParent = element.parentNode.parentNode;
  label = goog.dom.findNode(grandParent, function(node) {
    return (node.tagName === goog.dom.TagName.LABEL &&
      node.getAttribute('for') === element.getAttribute('id'));
  });
  if(label) {
      goog.dom.classes.enable(label,
        ck.widgets.forms.BoundInput.className.ERROR, add);
  }
};

/**
 * @return {boolean}
 */
ck.widgets.forms.BoundInput.prototype.isValid = function() {

  var element, allValidators;

  element = this.getElement();
  allValidators = goog.object.getValues(this.validators_);
  allValidators = goog.array.flatten(allValidators);
  return goog.array.every(allValidators, function(validator) {
      return validator.validate(this.getValue()).isValid();
  }, this);
};

/**
 * @private
 * @param {boolean} show
 */
ck.widgets.forms.BoundInput.prototype.showErrorMessage_ = function(show) {
};

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.BoundInput.prototype.useCanonValidation_ = false;

/**
 * @private
 * @return {Element}
 */
ck.widgets.forms.BoundInput.prototype.getErrorMessage_ = function () {

  var className;

  if (this.useCanonValidation_) {
    className = 'rs-validation-inline';
  } else {
    className = ck.widgets.forms.BoundInput.className.SECTION;
  }

  return goog.dom.getElementByClass(className, /** @type {Element} */ (this.getElement().parentNode));
};
