goog.provide('ck.widgets.forms.BoundForm');

goog.require('goog.events.EventType');
goog.require('goog.ui.Component');
goog.require('ck.query');
goog.require('ck.widgets.forms.BoundInput');
goog.require('ck.widgets.forms.filters.Filter');

/**
 * @constructor
 * @extends {goog.ui.Component}
 * @param {Object} dataSource
 * @param {function (?)=} opt_saveCallback
 * @param {boolean=} opt_useCanonValidation
 */
ck.widgets.forms.BoundForm = function (dataSource, opt_saveCallback, opt_useCanonValidation) {
  goog.base(this);
  this.dataSource_ = dataSource;
  this.saveCallback_ = opt_saveCallback || goog.nullFunction;
  this.boundInputs_ = {};
  this.validatedProperties_ = {};
  this.useCanonValidation_ = opt_useCanonValidation || false;
  this.filter_ = new ck.widgets.forms.filters.Filter();
};
goog.inherits(ck.widgets.forms.BoundForm, goog.ui.Component);

/**
 * @private
 * @type {Object}
 */
ck.widgets.forms.BoundForm.prototype.dataSource_ = null;

/**
 * @private
 * @type {ck.widgets.forms.filters.Filter}
 */
ck.widgets.forms.BoundForm.prototype.filter_ = null;

/**
 * @param {ck.widgets.forms.filters.Filter} filter
 */
ck.widgets.forms.BoundForm.prototype.registerFilter = function (filter) {
  this.filter_ = filter;
};

/**
 * @protected
 * @type {function (*)}
 */
ck.widgets.forms.BoundForm.prototype.saveCallback_ = goog.nullFunction;

/**
 * @param {Object} dataSource
 */
ck.widgets.forms.BoundForm.prototype.setDataSource = function (dataSource) {
  this.dataSource_ = dataSource;
};

/**
 * @param {function (?)} saveCallback
 */
ck.widgets.forms.BoundForm.prototype.setCallback = function (saveCallback) {
  this.saveCallback_ = saveCallback;
};

/**
 * @return {function (*)}
 */
ck.widgets.forms.BoundForm.prototype.getCallback = function () {
  return this.saveCallback_;
};

/**
 * @return {string}
 */
ck.widgets.forms.BoundForm.prototype.getBindAttribute = function () {
  return this.bindAttribute_;
};

/**
 * @private
 * @type {Object}
 */
ck.widgets.forms.BoundForm.prototype.boundInputs_ = null;

/**
 * @private
 * @type {Object}
 */
ck.widgets.forms.BoundForm.prototype.validatedProperties_ = null;

/**
 * @return {Object}
 */
ck.widgets.forms.BoundForm.prototype.getInputs = function () {
  return this.boundInputs_;
};

/**
 * @return {Object}
 */
ck.widgets.forms.BoundForm.prototype.serialize = function () {
  goog.object.forEach(this.boundInputs_, function (input, key) {
    this.dataSource_[key] = input.getValue();
  }, this);
  return this.filter_.filter(this.dataSource_);
};

/**
 * @param {string} key
 * @param {ck.validators.Validator} validator
 * @param {string} event
 */
ck.widgets.forms.BoundForm.prototype.validate = function (key, validator, event) {
  var validatorsForKey, input, bindAttribute;

  validatorsForKey = this.validatedProperties_[key] || [];
  validatorsForKey.push(new ck.widgets.ValidatedProperty(validator, event));
  this.validatedProperties_[key] = validatorsForKey;

  if (this.isInDocument()) {
    bindAttribute = this.bindAttribute_;
    input = this.getDomHelper().findNode(this.getElement(), function (node) {
      return goog.dom.isElement(node) && node.getAttribute(bindAttribute) === key;
    });
    this.addBoundInput_(input);
  }
};
/**
 * @param {Array.<string>} keys
 * @param {ck.validators.Validator} validator
 * @param {string} event
 */
ck.widgets.forms.BoundForm.prototype.validateMultiple = function (keys, validator, event) {
  goog.array.forEach(keys, function (key) {
    this.validate(key, validator, event);
  }, this);
};

/**
 * @param {string} key
 */
ck.widgets.forms.BoundForm.prototype.removeValidatorsByKey = function (key) {
  delete this.validatedProperties_[key];
  delete this.boundInputs_[key];
};

/**
 */
ck.widgets.forms.BoundForm.prototype.clear = function () {
  this.validatedProperties_ = {};
  this.boundInputs_ = {};
  this.removeChildren(true);
};

/** @inheritDoc */
ck.widgets.forms.BoundForm.prototype.canDecorate = function (element) {

  var dom, saveButtons;

  dom = this.getDomHelper();
  saveButtons = dom.getElementsByTagNameAndClass('button', 'save', element);
  return saveButtons.length === 1;
};

/** @inheritDoc */
ck.widgets.forms.BoundForm.prototype.decorateInternal = function (element) {
  goog.base(this, 'decorateInternal', element);
  this.setElementInternal(element);

  this.bindInputs();
};

ck.widgets.forms.BoundForm.prototype.bindInputs = function () {
  var dom, inputs, bindAttribute;

  bindAttribute = this.bindAttribute_;

  dom = this.getDomHelper();

  inputs = dom.findNodes(this.getElement(), function (node) {
    return goog.dom.isElement(node) && node.getAttribute(bindAttribute);
  });

  goog.array.forEach(inputs, function (input) {
    this.addBoundInput_(input);
  }, this);
};

ck.widgets.forms.BoundForm.prototype.addBoundInput_ = function (input) {
  var key, boundInput, validators, dom;

  dom = this.getDomHelper();
  key = input.getAttribute(this.bindAttribute_);
  boundInput = new ck.widgets.forms.BoundInput(dom, this.useCanonValidation_);
  validators = this.validatedProperties_[key] || [];
  goog.array.forEach(validators, function (property) {
    boundInput.addValidator(property.getValidator(), property.getEvent());
  });

  boundInput.decorate(input);
  if (this.dataSource_ && this.dataSource_[key]) {
    boundInput.setValue(this.dataSource_[key]);
  }
  this.boundInputs_[key] = boundInput;
};

/** @inheritDoc */
ck.widgets.forms.BoundForm.prototype.enterDocument = function () {
  var dom, saveButton;

  goog.base(this, 'enterDocument');
  dom = this.getDomHelper();
  saveButton = dom.getElementsByTagNameAndClass('button', 'save', this.getElement())[0];

  this.getHandler().listen(
    saveButton,
    goog.events.EventType.CLICK,
    this.updateDataSource_
  );
};

/**
 * @return {Object}
 */
ck.widgets.forms.BoundForm.prototype.getDataSource = function () {
  return this.dataSource_;
};

/**
 * @private
 * @param {goog.events.Event} e
 */
ck.widgets.forms.BoundForm.prototype.updateDataSource_ = function (e) {
  e.preventDefault();
  e.stopPropagation();
  this.runValidation();
};

/**
 */
ck.widgets.forms.BoundForm.prototype.runValidation = function () {
  var dom, element, isValid, inputs, firstError;

  dom = this.getDomHelper();
  element = this.getElement();
  inputs = goog.object.getValues(this.boundInputs_);
  goog.array.forEach(inputs, function (input) {
    input.runAllValidations();
  });
  isValid = goog.array.every(inputs, function (input) {
    return input.isValid();
  });

  if (isValid) {
    this.saveCallback_.call(
      this,
      this.serialize()
    );
  } else {
    firstError = this.getFirstError();

    if (firstError && this.shouldScrollToFirstError()) {
      firstError.scrollIntoView(false);
    }
  }
};

/**
 * @param {string} inputKey
 */
ck.widgets.forms.BoundForm.prototype.runInputValidation = function (inputKey) {
  var input;
  input = this.boundInputs_[inputKey];
  input.runAllValidations();
};

/**
 * @return {Element}
 */
ck.widgets.forms.BoundForm.prototype.getFirstError = function () {
  return ck.query('.error .message-text');
};

/**
 * @param {string} key
 * Checks a single bound input, not saving regardless of whether it is valid.
 */
ck.widgets.forms.BoundForm.prototype.checkSingleInput = function (key) {
  var input;

  input = this.boundInputs_[key];
  input.runAllValidations();
};

/**
 * param {string} computedFieldKey
 * @param {...string} var_args
 */
ck.widgets.forms.BoundForm.prototype.registerComputedField = function (computedFieldKey, var_args) {
  var parameters, computedFieldInput;
  parameters = goog.array.toArray(arguments).slice(1);

  computedFieldInput = this.boundInputs_[computedFieldKey];
  goog.array.forEach(parameters, function (inputKey) {
    var input;
    input = this.boundInputs_[inputKey];
    computedFieldInput.makeComputedFrom(input);
  }, this);
};

/**
 * @constructor
 * @param {ck.validators.Validator} validator
 * @param {string} eventType
 */
ck.widgets.ValidatedProperty = function (validator, eventType) {
  this.validator_ = validator;
  this.event_ = eventType;
};

/**
 * @private
 * @type {ck.validators.Validator}
 */
ck.widgets.ValidatedProperty.prototype.validator_ = null;

/**
 * @private
 * @type {string}
 */
ck.widgets.ValidatedProperty.prototype.event_ = '';

/**
 * @return {ck.validators.Validator}
 */
ck.widgets.ValidatedProperty.prototype.getValidator = function () {
  return this.validator_;
};

/**
 * @return {string}
 */
ck.widgets.ValidatedProperty.prototype.getEvent = function () {
  return this.event_;
};

/**
 * @private
 * @type {string}
 */
ck.widgets.forms.BoundForm.prototype.bindAttribute_ = 'data-bound-key';

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.BoundForm.prototype.useCanonValidation_ = false;

/**
 * @private
 * @type {boolean}
 */
ck.widgets.forms.BoundForm.prototype.scrollsToFirstError_ = false;

/**
 * @protected
 * @return {boolean}
 */
ck.widgets.forms.BoundForm.prototype.shouldScrollToFirstError = function () {
  return this.scrollsToFirstError_;
};

ck.widgets.forms.BoundForm.prototype.enableScrollToFirstError = function () {
  this.scrollsToFirstError_ = true;
};
