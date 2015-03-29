goog.provide('ck.LogoutTimer');
goog.provide('ck.logout');

goog.require('ck.urls.Logout');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.async.Throttle');
goog.require('goog.Uri');
goog.require('ck.Logger');
goog.require('ck.StatsClient');
goog.require('ck.io');

/**
 * This class handles the behavior of logging the user out before we expect
 * their session to expire.  This is more complicated than a setTimeout() call
 * because setTimeout() pauses if the user's laptop is closed.  It compares
 * goog.now() with the session expiration timestamp on an interval, forcing a
 * redirect if we are past that time.
 *
 * @constructor
 * @extends {goog.async.ConditionalDelay}
 * @param {number} authTokenExpiresIn milliseconds until the session expires.
 */
ck.LogoutTimer = function (authTokenExpiresIn) {
  goog.base(this, ck.LogoutTimer.prototype.checkExpired, this);

  this.authTokenExpiresIn_ = authTokenExpiresIn;
  this.authTokenExpiresAt_ = goog.now() + authTokenExpiresIn;

  this.sessionExpiresIn_ = ck.UserAccount.getSessionTtl() * 1000;
  this.sessionExpiresAt_ = goog.now() + this.sessionExpiresIn_;
  this.lastSessionExtensionCallTime_ = goog.now();
  this.extendSessionThrottler_ = this.createExtendSessionThrottler();

  this.root_ = goog.dom.getDocument();

  this.extendSessionListener();

};
goog.inherits(ck.LogoutTimer, goog.async.ConditionalDelay);

/**
 * @type {number} The time between extension XHR calls to prevent multiple calls in a short period of time.
 */
ck.LogoutTimer.lastExtensionCooldown = 30000;

/**
 * Polling interval for time check.
 *
 * @const {number}
 */
ck.LogoutTimer.INTERVAL = 5000;

/**
 * @type {?number} Time in milliseconds in which the auth token expires.
 * @private
 */
ck.LogoutTimer.prototype.authTokenExpiresIn_ = null;

/**
 * @type {?number} UNIX timestamp of auth token expiration time.
 * @private
 */
ck.LogoutTimer.prototype.authTokenExpiresAt_ = null;

/**
 * @type {?number} Time in milliseconds in which the session expires.
 * @private
 */
ck.LogoutTimer.prototype.sessionExpiresIn_ = null;

/**
 * @type {?number} UNIX timestamp of session expiration time.
 * @private
 */
ck.LogoutTimer.prototype.sessionExpiresAt_ = null;

/**
 * @type {?number} The last time /extend_session was called.
 * @private
 */
ck.LogoutTimer.prototype.lastSessionExtensionCallTime_ = null;

/**
 * @type {?goog.async.Throttle}
 * @private
 */
ck.LogoutTimer.prototype.extendSessionThrottler_ = null;

/**
 * @type {?Document}
 * @private
 */
ck.LogoutTimer.prototype.root_ = null;

/**
 * @return {goog.async.Throttle}
 */
ck.LogoutTimer.prototype.createExtendSessionThrottler = function () {
  return new goog.async.Throttle(function () {
    var extendSessionUrl;

    extendSessionUrl = ck.UserAccount.getBasePath() + "/extend_session";

    ck.io.get(extendSessionUrl, goog.bind(this.extendSession_, this));
  }, ck.LogoutTimer.lastExtensionCooldown, this);
};

/**
 *
 */
ck.LogoutTimer.prototype.extendSession_ = function (e) {
  var xhr, extendSessionAnswer;

  xhr = e.target;
  extendSessionAnswer = xhr.getResponse();
  if (extendSessionAnswer === "OK") {
    this.sessionExpiresAt_ = goog.now() + this.getSessionExpiresIn();
  }
};

/**
 * Set up a listener and extend the session when a mouse click event is fired.
 */
ck.LogoutTimer.prototype.extendSessionListener = function () {
  goog.events.listen(this.root_, [goog.events.EventType.CLICK, goog.events.EventType.KEYUP], function (e) {
    this.extendSessionThrottler_.fire();
  }, undefined, this);
};

/**
 * Check the expiration time against goog.now().
 * @return {boolean} Whether or not the session has expired.
 */
ck.LogoutTimer.prototype.checkExpired = function () {
  if (ck.UserAccount.shouldSessionRefresh()) {
    this.extendSessionThrottler_.fire();
  }
  return ((goog.now() > this.getAuthTokenExpiresAt()) || (goog.now() > this.getSessionExpiresAt()));
};

/**
 * @return {?number}
 */
ck.LogoutTimer.prototype.getSessionExpiresIn = function () {
  return this.sessionExpiresIn_;
};

/**
 * @return {?number}
 */
ck.LogoutTimer.prototype.getSessionExpiresAt = function () {
  return this.sessionExpiresAt_;
};

/**
 * @return {?number}
 */
ck.LogoutTimer.prototype.getAuthTokenExpiresIn = function () {
  return this.authTokenExpiresIn_;
};

/**
 * @return {?number}
 */
ck.LogoutTimer.prototype.getAuthTokenExpiresAt = function () {
  return this.authTokenExpiresAt_;
};

/**
 * This function gets invoked by goog.async.ConditionalDelay when the
 * condition (has the session expired?) returns true.
 * @override
 */
ck.LogoutTimer.prototype.onSuccess = function () {
  ck.Logger.getInstance().info(
    'logout',
    goog.string.subs(
      'logging user out because session expired, Auth Token expires at %s ms, Session expires at %s ms',
      this.getAuthTokenExpiresIn(),
      this.getSessionExpiresIn()
    )
  );

  ck.logout.forceLogout(ck.logout.SESSION_EXPIRED);
};

/**
 * @type {string}
 */
ck.logout.SESSION_EXPIRED = 'SESSION_EXPIRED';

/**
 * Deal with an expired session by redirecting the user to the logout page.
 * @param {string=} opt_message
 */
ck.logout.forceLogout = function(opt_message) {
  var statsClient, currentLocation, currentUri, logoutUri, nextPath;

  statsClient = new ck.StatsClient();
  if (opt_message === ck.logout.SESSION_EXPIRED) {
    statsClient.increment('logout.session_expiration');
  } else {
    statsClient.increment('logout.other');
  }

  currentLocation = goog.object.get(goog.global, 'location');
  currentUri = new goog.Uri(currentLocation.toString());

  nextPath = goog.string.buildString(currentUri.getPath(), '#',
    currentUri.getFragment());
  logoutUri = new goog.Uri(ck.urls.Logout);
  logoutUri.setParameterValue('next', nextPath);
  if (opt_message) {
    logoutUri.setParameterValue('message', opt_message);
  }

  ck.logout.redirect(logoutUri.toString());
};

/**
 * Send the user to a different URI.
 * @param {string} uri URL to redirect to
 */
ck.logout.redirect = function(uri) {
  goog.object.get(goog.global, 'location').assign(uri);
};
