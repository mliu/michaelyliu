goog.provide('ck.ModuleManager');

goog.require('goog.module.ModuleManager');

/**
 * @constructor
 * @suppress {visibility|accessControls}
 * @extends {goog.module.ModuleManager}
 */
ck.ModuleManager = function () {
  goog.base(this);

  /**
   * A mapping from module id to ModuleInfo object.
   * @type {Object}
   * @public
   */
  this.moduleInfoMap_ = {};

 /**
   * The requested ids of the currently loading modules. This does not include
   * module dependencies that may also be loading.
   * @type {Array.<string>}
   * @public
   */
  this.requestedLoadingModuleIds_ = [];
};
goog.inherits(ck.ModuleManager, goog.module.ModuleManager);
goog.addSingletonGetter(ck.ModuleManager);

