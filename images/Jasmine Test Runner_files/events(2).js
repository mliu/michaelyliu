goog.provide('ck.data.events');
goog.provide('ck.data.events.AggregatedEvent');
goog.provide('ck.data.events.RackspaceErrorEvent');
goog.provide('ck.data.events.ModelCreatedEvent');

goog.require('goog.events.Event');
goog.require('servo.events.StoreErrorEvent');

/**
 * Basic error event for handling data from an API with Respose exception
 * middleware (i.e. most modern Rackspace APIs).
 * @constructor
 * @extends {servo.events.StoreErrorEvent}
 * @param {Object} target
 * @param {Object|string} error
 * @param {number=} opt_code
 * @param {string=} opt_statusText
 */
ck.data.events.RackspaceErrorEvent = function (target, error, opt_code, opt_statusText) {
  goog.base(this, target, error, opt_code, opt_statusText);
};
goog.inherits(ck.data.events.RackspaceErrorEvent, servo.events.StoreErrorEvent);

/**
 * @return {string}
 */
ck.data.events.RackspaceErrorEvent.prototype.getMessage = function () {
  if (this.code === 503) {
    return ck.data.events.RackspaceErrorEvent.UNAVAILABLE_MESSAGE;
  } else if (this.isLoadbalancerControlsMessage_()) {
    return ck.data.events.RackspaceErrorEvent.DEFAULT_MESSAGE;
  }

  if (goog.isString(this.data)) {
    return this.getMessageForStringData_();
  }

  return this.getMessageForObjectData_();
};

/**
 * @private
 * @return {boolean}
 */
ck.data.events.RackspaceErrorEvent.prototype.isLoadbalancerControlsMessage_ = function () {
  return (
    goog.isString(this.data) &&
      this.data.indexOf('Our control panel is down for maintenance.') !== -1
  );
};

/**
 * @private
 * @return {string}
 */
ck.data.events.RackspaceErrorEvent.prototype.getMessageForStringData_ = function () {
  if (goog.string.isEmptySafe(/** @type {string} */ (this.data))) {
    return ck.data.events.RackspaceErrorEvent.DEFAULT_MESSAGE;
  }

  return /** @type {string} */ (this.data);
};

/**
 * @private
 * @return {string}
 */
ck.data.events.RackspaceErrorEvent.prototype.getMessageForObjectData_ = function () {
  var keys;

  keys = goog.object.getKeys(/** @type {Object} */ (this.data));
  if (keys.length === 1 && this.data[keys[0]]['message']) {
    return this.data[keys[0]]['message'];
  } else {
    return ck.data.events.RackspaceErrorEvent.DEFAULT_MESSAGE;
  }
};

/**
 * @type {string}
 */
ck.data.events.RackspaceErrorEvent.DEFAULT_MESSAGE = gettext('There was an error processing your request.');

/**
 * @type {string}
 */
ck.data.events.RackspaceErrorEvent.UNAVAILABLE_MESSAGE = gettext('Service unavailable');

/**
 * @return {boolean}
 */
ck.data.events.RackspaceErrorEvent.prototype.canRetry = function () {
  return this.isRetryable_;
};

/**
 * @return {ck.data.events.RackspaceErrorEvent}
 */
ck.data.events.RackspaceErrorEvent.prototype.asNotRetryable = function () {
  this.isRetryable_ = false;
  return this;
};

/**
 * @private
 * @type {boolean}
 */
ck.data.events.RackspaceErrorEvent.prototype.isRetryable_ = true;

/**
 * @constructor
 * @param {?number|?string} providerId
 * @param {?number|?string} modelId
 * @extends {goog.events.Event}
 */
ck.data.events.ModelCreatedEvent = function (providerId, modelId) {
  goog.base(this, ck.data.events.EventType.MODEL_CREATED, null);

  this.providerId = providerId;
  this.modelId = modelId;
};
goog.inherits(ck.data.events.ModelCreatedEvent, goog.events.Event);

/**
 * @type {?number|?string}
 */
ck.data.events.ModelCreatedEvent.prototype.providerId = null;

/**
 * @type {?number|?string}
 */
ck.data.events.ModelCreatedEvent.prototype.modelId = null;

/**
 * @param {Object} target
 * @param {Array.<goog.events.Event>=} opt_innerErrors
 * @param {boolean=} opt_isError Indicates error occurred.
 * @constructor
 * @extends {goog.events.Event}
 */
ck.data.events.AggregatedEvent = function (target, opt_innerErrors, opt_isError) {
	var type;
  this.innerErrors = opt_innerErrors || [];
  this.isError = !!(opt_isError || !goog.array.isEmpty(this.innerErrors));
	type = this.isError ? servo.events.EventType.ERROR : servo.events.EventType.SUCCESS;
  goog.base(this, type, target);
};
goog.inherits(ck.data.events.AggregatedEvent, goog.events.Event);

/**
 * @return {{message: string, details: string}|null}
 */
ck.data.events.AggregatedEvent.prototype.getErrorData = function () {
  var errorData, errorDetails;
  if (!this.isError) {
    return null;
  }
  errorData = {
    'message': gettext('There was a problem performing this action.'),
    'details': ''
  };
  if (goog.array.isEmpty(this.innerErrors)) {
    return errorData;
  }
  errorDetails = goog.array.map(this.innerErrors, function (e) {
    if (e.type === servo.events.EventType.TIMEOUT) {
      return gettext('A timeout occurred.');
    }
    if (e.data && e.data.message) {
      return goog.object.get(e.data, 'message', '');
    }
    return '';
  });
	errorData['details'] = goog.string.trim(errorDetails.join(' '));
  return errorData;
};

/**
 * @enum {string}
 */
ck.data.events.EventType = {
  MODEL_CREATED: goog.events.getUniqueId('MODEL_CREATED'),
  BATCH_ACTION_INITIATED: goog.events.getUniqueId('BATCH_ACTION_INITIATED'),
  BATCH_ACTION_CANCEL: goog.events.getUniqueId('BATCH_ACTION_CANCEL'),
  BATCH_ACTION_COMPLETE: goog.events.getUniqueId('BATCH_ACTION_COMPLETE')
};
