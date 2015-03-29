goog.provide('ck.analytics.Tracker');

goog.require('ck.Logger');
goog.require('goog.string');

/**
 * @constructor
 * @param {ck.Logger=} opt_logger
 */
ck.analytics.Tracker = function (opt_logger) {
  this.logger_ = opt_logger || ck.Logger.getInstance();
};
goog.addSingletonGetter(ck.analytics.Tracker);

/**
 */
ck.analytics.Tracker.prototype.start = function () {
  if (this.isCoreMetricsAvailable()) {
    this.execute_(
      'cmSetClientID',
      goog.global['CORE_METRICS_CLIENT_ID'],
      false,
      goog.global['CORE_METRICS_URL'],
      goog.global['CORE_METRICS_COOKIE_DOMAIN']
    );
    this.isStarted_ = true;
  }
};

/**
 * @param {?string} page
 * @param {?string} section
 */
ck.analytics.Tracker.prototype.trackPageView = function (page, section) {
  var accountId, userRegion, isManaged, isRackConnect, attributeString;

  accountId = ck.UserAccount.accountId();
  if (!this.isValidAccountId_(accountId)) {
    return;
  }

  userRegion = ck.UserAccount.getUserRegion();
  isManaged = ck.UserAccount.isManaged();
  isRackConnect = ck.UserAccount.isRackConnect();

  attributeString = this.getAttributeString_(accountId.toString(), userRegion, isManaged, isRackConnect);

  this.execute_('cmCreatePageviewTag', page, section, null, null, attributeString);
  this.logger_.debug('analytics', 'page view {$page} {$section}', {
    'page': page,
    'section': section
  });
};

ck.analytics.Tracker.prototype.trackCustomerInfo = function () {
  var accountId, userRegion, isManaged, isRackConnect, attributeString;

  accountId = ck.UserAccount.accountId();
  if (!this.isValidAccountId_(accountId)) {
    return;
  }

  userRegion = ck.UserAccount.getUserRegion();
  isManaged = ck.UserAccount.isManaged();
  isRackConnect = ck.UserAccount.isRackConnect();

  attributeString = this.getAttributeString_(userRegion, isManaged, isRackConnect);

  this.execute_('cmCreateRegistrationTag', accountId.toString(), null, null, null, null, null, attributeString);
};

/**
 * @param {string} productId
 */
ck.analytics.Tracker.prototype.startTransaction = function (productId) {
  this.execute_('cmCreateProductviewTag', productId, productId);
};

/**
 * @enum {string}
 */
ck.analytics.Tracker.ConversionActionType = {
  CONVERSION_STARTED: '1',
  CONVERSION_SUCCESS: '2'
};

/**
 * @enum {string}
 */
ck.analytics.Tracker.ConversionCategory = {
  POPOVER_VIEWONLY: 'POPOVER_VIEWONLY',
  POPOVER_FORM: 'POPOVER'
};

/**
 * @type {Object.<string, string>}
 */
ck.analytics.Tracker.ConversionActionTypeToDescription =
  goog.object.transpose(ck.analytics.Tracker.ConversionActionType);

/**
 * @param  {string} eventId
 * @param  {ck.analytics.Tracker.ConversionActionType} actionType
 * @param  {string} eventCategoryId
 */
ck.analytics.Tracker.prototype.trackConversion = function (eventId, actionType, eventCategoryId) {
  var accountId, userRegion, isManaged, isRackConnect, attributeString;

  accountId = ck.UserAccount.accountId();
  if (!this.isValidAccountId_(accountId)) {
    return;
  }

  userRegion = ck.UserAccount.getUserRegion();
  isManaged = ck.UserAccount.isManaged();
  isRackConnect = ck.UserAccount.isRackConnect();

  attributeString = this.getAttributeString_(accountId, userRegion, isManaged, isRackConnect);

  this.execute_('cmCreateConversionEventTag', eventId, actionType, eventCategoryId, null, attributeString);
  this.logger_.debug(
    'analytics',
    'conversion event: {$eventId} {$actionTypeDescription} {$eventCategoryId}',
    {
      'eventId': eventId,
      'actionTypeDescription': ck.analytics.Tracker.ConversionActionTypeToDescription[actionType],
      'eventCategoryId': eventCategoryId
    }
  );
};

/**
 * @param {string} productId
 * @param {string} productName
 * @param {number} quantity
 * @param {number} price
 */
ck.analytics.Tracker.prototype.trackAddToCart = function (productId, productName, quantity, price) {
  this.execute_('cmCreateShopAction5Tag', productId, productName, quantity.toString(), price.toString());
  this.logger_.debug(
    'analytics',
    'add to cart {$productId} {$productName} {$quantity} {$price}',
    {
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'price': price
    }
  );
};

/**
 * @param {string} elementId
 */
ck.analytics.Tracker.prototype.trackClick = function (elementId) {
  this.execute_('cmCreateElementTag', elementId, 'element click');
  this.logger_.debug(
    'analytics',
    '{$elementId} element clicked',
    {
      'elementId': elementId
    }
  );
};

/**
 * @param {string} dialogId
 */
ck.analytics.Tracker.prototype.trackDialogDisplay = function (dialogId) {
  this.execute_('cmCreateElementTag', dialogId, 'dialog view');
  this.logger_.debug(
    'analytics',
    '{$dialogId} dialog viewed',
    {
      'dialogId': dialogId
    }
  );
};

/**
 * @param {string} elementId
 */
ck.analytics.Tracker.prototype.trackElementView = function (elementId) {
  this.execute_('cmCreateElementTag', elementId, 'element view');
  this.logger_.debug(
    'analytics',
    '{$elementId} element view',
    {
      'elementId': elementId
    }
  );
};

/**
 * @param {string} productId
 * @param {string} productName
 * @param {number} quantity
 * @param {number} price
 * @param {string} orderId
 */
ck.analytics.Tracker.prototype.trackCheckout = function (productId, productName, quantity, price, orderId) {
  var accountId;

  accountId = ck.UserAccount.accountId();
  if (!this.isValidAccountId_(accountId)) {
    return;
  }

  this.execute_('cmCreateShopAction9Tag', productId, productName, quantity.toString(),
    price.toString(), ck.UserAccount.accountId(), orderId, price.toString());
  this.logger_.debug(
    'analytics',
    'checkout {$productId} {$productName} {$quantity} {$price} {$orderId}',
    {
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'price': price,
      'orderId': orderId
    }
  );
};

ck.analytics.Tracker.prototype.completeTransaction = function () {
  this.execute_('cmDisplayShops');
};

/**
 * @param {string} orderId
 * @param {number} orderTotal
 */
ck.analytics.Tracker.prototype.createOrder = function (orderId, orderTotal) {

  var accountId;

  accountId = ck.UserAccount.accountId();
  if (!this.isValidAccountId_(accountId)) {
    return;
  }

  this.execute_('cmCreateOrderTag', orderId, orderTotal.toString(), '0.00', ck.UserAccount.accountId());
  this.logger_.debug(
    'analytics',
    'create order {$orderId} {$orderTotal}',
    {
      'orderId': orderId,
      'orderTotal': orderTotal
    }
  );
};

/**
 * @param {...} var_attributes
 * @return {string}
 */
ck.analytics.Tracker.prototype.getAttributeString_ = function (var_attributes) {
  var attributes;

  attributes = goog.array.toArray(arguments);

  return attributes.join('-_-');
};

/**
 * @private
 * @param {...} var_args
 */
ck.analytics.Tracker.prototype.execute_ = function (var_args) {
  var functionName, functionArgs, argsArray;

  argsArray = goog.array.toArray(arguments);
  functionName = argsArray[0];
  functionArgs = argsArray.slice(1);

  // allow cmSetClientID to be called, as it sets isStarted
  if (this.isStarted_ || functionName === 'cmSetClientID') {
    try {
      goog.global[functionName].apply(goog.global, functionArgs);
    } catch (e) {
      this.logger_.error(
        'Core Metrics',
        goog.string.subs(
          'Error executing %s with arguments: [%s]',
          functionName,
          functionArgs.join(', ')
        )
      );
    }
  }
};

/**
 * @return {boolean}
 */
ck.analytics.Tracker.prototype.isCoreMetricsAvailable = function () {
  return (!goog.global['HIDE_CORE_METRICS'] && goog.isDef(goog.global['cmSetClientID']));
};

/**
 * @private
 * @param {string} accountId
 * @return {boolean}
 */
ck.analytics.Tracker.prototype.isValidAccountId_ = function (accountId) {
  return goog.isDefAndNotNull(accountId);
};

/**
 * @type {boolean}
 */
ck.analytics.Tracker.prototype.isStarted_ = false;
