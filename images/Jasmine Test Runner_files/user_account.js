goog.provide('ck.UserAccount');

goog.require('ck.constants');
goog.require('ck.capabilities.RoleMap');
goog.require('ck.BrowserFeatures');
goog.require('goog.array');

/**
 * @return {string}
 */
ck.UserAccount.getUsername = function () {
  return /** @type {string} */ (goog.object.get(goog.global, 'account'));
};

/**
 * @return {string}
 */
ck.UserAccount.getUserId = function () {
  return goog.global['AUTH_USER_INFO']['id'];
};

/**
 * @return {string}
 */
ck.UserAccount.getBasePath = function () {
  return goog.global['REACH_BASE_PATH'];
};

/**
 * @return {string}
 */
ck.UserAccount.getVerificationNumber = function () {
  return ck.UserAccount.isUk() ? '+44 (0)208 734 4269' : '1-877-934-0407';
};

/**
 * @return {boolean}
 */
ck.UserAccount.isUk = function() {
  return /** @type {boolean} */ (goog.object.get(goog.global, 'IS_UK_CUSTOMER') || false);
};

/**
 * @return {boolean}
 */
ck.UserAccount.isAu = function () {
  return ck.UserAccount.defaultRegion() === ck.data.Provider.Region.SYD;
};

/**
 * @return {string}
 */
ck.UserAccount.getUserRegion = function () {
  if (ck.UserAccount.isUk()) {
    return 'UK';
  }
  else {
    return 'US';
  }
};

/**
 * @return {boolean}
 */
ck.UserAccount.isManaged = function() {
  return ck.UserAccount.hasRole_(ck.constants.MANAGED_AUTH_ROLE);
};

/**
 * @return {boolean}
 */
ck.UserAccount.isRackConnect = function () {
  return ck.UserAccount.hasRole_(ck.constants.RACK_CONNECT_ROLE);
};

/**
 * @param {string} region
 * @return {boolean}
 */
ck.UserAccount.isRackConnect3InRegion = function (region) {
  var role;

  role = goog.string.subs('rackconnect:v3-%s', region);
  return ck.Features.hasRackConnect3() && ck.UserAccount.hasRole_(role);
};

/**
 * @return {boolean}
 */
ck.UserAccount.isUserAdmin = function () {
  return ck.UserAccount.hasRole_('identity:user-admin');
};

/**
 * @return {boolean}
 */
ck.UserAccount.hasHadFirstTimeExperience = function() {
  return /** @type {boolean} */ (goog.object.get(
    goog.global, 'HAS_HAD_FIRST_TIME_EXPERIENCE', true)
  );
};

/**
 * @return {boolean}
 */
ck.UserAccount.hasSeenMultiUserDialog = function () {
  return /** @type {boolean} */ (goog.object.get(
    goog.global, 'HAS_SEEN_MULTI_USER_DIALOG', true)
  );
};

ck.UserAccount.markMultiUserDialogAsSeen = function () {
  goog.global['HAS_SEEN_MULTI_USER_DIALOG'] = true;
};

/**
 * @return {boolean}
 */
ck.UserAccount.shouldShowDeploymentsDialog = function () {
  return !goog.global['HAS_SEEN_DEPLOYMENTS_DIALOG'];
};

ck.UserAccount.markDeploymentsDialogAsSeen = function () {
  goog.global['HAS_SEEN_DEPLOYMENTS_DIALOG'] = true;
};

/**
 * @return {string}
 */
ck.UserAccount.accountId = function() {
  return /** @type {string} */ (goog.object.get(goog.global, 'FIRSTGEN_SERVERS_TENANT_ID'));
};

/**
 * @return {boolean}
 */
ck.UserAccount.hideAccountSettings = function () {
  return /** @type {boolean} */ (goog.object.get(
    goog.global,
    'HIDE_ACCOUNT_SETTINGS',
    false
  ));
};

/**
 * @return {string}
 */
ck.UserAccount.defaultRegion = function() {
  var defaultRegion;

  defaultRegion = /** @type {string} */(goog.object.get(goog.global, 'DEFAULT_REGION'));
  if (goog.string.isEmpty(defaultRegion)) {
    defaultRegion = 'DFW';
  }

  return defaultRegion;
};

/**
 * @return {string}
 */
ck.UserAccount.getPaymentCaptureFormUrl = function () {
  return goog.global['PAYMENT_CAPTURE_FORM_URL'];
};

/**
 * @private
 * @return {Array.<string>}
 */
ck.UserAccount.getRoles_ = function () {
  return goog.global['AUTH_ROLES'] || [];
};

/**
 * @return {boolean}
 */
ck.UserAccount.hasBigdata = function () {
  return ck.UserAccount.hasServiceType_(ck.data.Providers.ServiceType.BIGDATA);
};

/**
 * @return {boolean}
 */
ck.UserAccount.shouldShowBigdataRbac = function () {
  return ck.UserAccount.hasBigdata();
};

/**
 * @return {boolean}
 */
ck.UserAccount.hasCloudFilesProgressUpload = function () {
  return goog.global['HAS_CLOUD_FILES_PROGRESS_UPLOAD'] && ck.BrowserFeatures.FILE_API;
};

/**
 * @return {boolean}
 */
ck.UserAccount.shouldShowOrchestration = function () {
  return ck.Features.hasOrchestration() && ck.UserAccount.hasServiceType_(ck.data.Providers.ServiceType.ORCHESTRATION);
};

/**
 * @return {boolean}
 */
ck.UserAccount.canSeeBigdataLimitedAvailabilityPage = function () {
  return ck.UserAccount.isUserAdmin() && !ck.UserAccount.hasBigdata();
};

/**
 * @return {boolean}
 */
ck.UserAccount.shouldShowMultifactorAuth = function () {
  return ck.UserAccount.hasRole_('identity:multifactor_beta') && ck.Features.has('can_see_multifactor_auth');
};

/**
 * @return {boolean}
 */
ck.UserAccount.hasFirstGenProvider = function () {
  var providers;

  providers = ck.data.Providers.getInstance();
  return providers.hasFirstGenServerProvider();
};

/**
 * @param {string|Array.<string>} capability
 * @return {boolean}
 */
ck.UserAccount.hasCapability = function (capability) {
  if (ck.UserAccount.isUserAdmin()) {
    return true;
  }

  if(goog.isArray(capability)) {
    return ck.UserAccount.hasAllCapabilities_(capability);
  }

  return goog.array.some(ck.UserAccount.getRoles_(), function (role) {
    var capabilities;
    capabilities = ck.capabilities.RoleMap[role] || [];
    return goog.array.contains(capabilities, capability);
  });
};

/**
 * @return {boolean}
 */
ck.UserAccount.shouldSessionRefresh = function () {
  return /** @type {boolean} */ (goog.object.get(
    goog.global,
    'SESSION_REFRESH',
    false
  ));
};

/**
 * @param {boolean} sessionRefresh
 */
ck.UserAccount.setSessionRefresh = function (sessionRefresh) {
  goog.global['SESSION_REFRESH'] = sessionRefresh;
};

/**
 * @private
 * @param {Array.<string>} capabilities
 * @return {boolean}
 */
ck.UserAccount.hasAllCapabilities_ = function (capabilities) {
  return goog.array.every(capabilities, function (capability) {
    return ck.UserAccount.hasCapability(capability);
  });
};

/** @return {boolean} */
ck.UserAccount.canUpgradeToManaged = function () {
  return ck.UserAccount.isUserAdmin() && !ck.UserAccount.isManaged();
};

/**
 * @private
 * @param {string} serviceType
 * @returns {boolean}
 */
ck.UserAccount.hasServiceType_ = function (serviceType) {
  var providers, provider;

  providers = ck.data.Providers.getInstance();
  provider = providers.filterByServiceType(serviceType);
  return !goog.array.isEmpty(provider);
};

/**
 * @private
 * @param {string} role
 * @return {boolean}
 */
ck.UserAccount.hasRole_ = function (role) {
  return goog.array.contains(ck.UserAccount.getRoles_(), role);
};

/**
 * @return {number}
 */
ck.UserAccount.getSessionTtl = function () {
  return /** @type {number} */ (goog.global['SESSION_TTL']);
};
