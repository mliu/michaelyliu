goog.provide('ck.init');

goog.require('goog.Delay');
goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.ui.IdGenerator');
goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('ck.ModuleManager');
goog.require('ck.timeline');

/**
 * Indicates if the app was loaded ok or not.
 * @type {boolean}
 * @private
 */
ck.init.appLoadOk_ = false;

/**
 * Static function that should be called when an app loads ok,
 * or has a fatal error.
 * @param {boolean} status
 */
ck.init.setAppStatus = function (status) {
  ck.init.appLoadOk_ = status;
  ck.timeline.recordMessage('app status true');
};

/**
 * Static function that gets the app status.
 * @return {boolean}
 */
ck.init.getAppStatus = function () {
  return ck.init.appLoadOk_;
};

ck.init.ready = function (callback, module) {

  var delay;

  delay = new goog.async.Delay(function () {

    var delay;

    if (!goog.dom.getDocument().body) {
      delay = new goog.async.Delay(ck.init.ready, 0);
      delay.start();
    } else {
      if (callback) {
        ck.init.setAppStatus(true);
        ck.init.setModuleLoaded(module);

        if (!ck.logger) {
          ck.logger = goog.debug.Logger.getLogger('ck');
          //console logging if ?Debug=true in URL
          goog.debug.Console.autoInstall();
        }
        if (!ck.id_generator) {
          ck.id_generator = new goog.ui.IdGenerator();
        }
        delay = new goog.async.Delay(callback, 0);
        delay.start();
      }
    }
  }, 0);
  delay.start();
};

/**
 * @return {Array.<string>}
 */
ck.init.getFailedModules = function () {
  var loadedModules, requestedModules;

  loadedModules = ck.init.getLoadedModules();
  requestedModules = ck.ModuleManager.getInstance().requestedLoadingModuleIds_;

  return goog.array.filter(requestedModules, function (module) {
    return !goog.array.contains(loadedModules, module);
  });
};

/**
 * @return {Array.<string>}
 */
ck.init.getLoadedModules = function () {
  var manager, modules;

  manager = ck.ModuleManager.getInstance();
  modules = [];
  return goog.object.getKeys(
    goog.object.filter(manager.moduleInfoMap_, function (value, key) {
      return manager.getModuleInfo(key).isLoaded();
    })
  );
};

/**
 * @param {string} module
 */
ck.init.setModuleLoaded = function (module) {
  var manager;

  manager = ck.ModuleManager.getInstance();
  manager.setLoaded(module);
  ck.timeline.recordMessage(goog.string.subs('module %s loaded', module));
};

goog.exportSymbol('ck.init.getAppStatus', ck.init.getAppStatus);
goog.exportSymbol('ck.init.getFailedModules', ck.init.getFailedModules);
goog.exportSymbol('ck.init.getLoadedModules', ck.init.getLoadedModules);
