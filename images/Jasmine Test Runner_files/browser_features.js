goog.provide('ck.BrowserFeatures');

ck.BrowserFeatures = {
  FILE_API: goog.isDefAndNotNull(goog.global['FileReader'])
};
