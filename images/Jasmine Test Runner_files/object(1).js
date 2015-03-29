goog.provide('ck.utility.object');

goog.require('goog.object');

/**
 * @param {Object} target
 * @param {...*} var_args
 * @return {Object}
 */
ck.utility.object.merge = function (target, var_args) {
  var result, sources, normalizedSources;
  result = {};
  target = target || {};
  sources = Array.prototype.slice.call(arguments, 1);
  normalizedSources = [];

  goog.object.forEach(sources, function(source) {
    if(goog.isDefAndNotNull(source)) {
      normalizedSources.push(source);
    }
  });

  goog.object.extend.apply(
    goog.object, [result, target].concat(normalizedSources)
  );

  return result;
};

/**
 * @param {Object} object1
 * @param {Object} object2
 * @return {Object}
 */
ck.utility.object.deepMerge = function (object1, object2) {
  var result;

  result = goog.object.clone(object1);
  goog.object.forEach(object2, function (v2, k) {
    var v1;

    v1 = result[k];
    if (!goog.isDef(v1)) {
      // key is not defined in object1, so use value in object2
      result[k] = v2;
    } else {
      // nicely merge the values at object1[k] and object2[k]
      if (goog.isArray(v1) && goog.isArray(v2)) {
        result[k] = goog.array.concat(v1, v2);
      } else if (goog.isObject(v1) && goog.isObject(v2) &&
                 !goog.isArray(v1) && !goog.isArray(v2) &&
                 !goog.isFunction(v1) && !goog.isFunction(v2)) {
        result[k] = ck.utility.object.deepMerge(v1, v2);
      } else {
        // second object wins in the case of an irresolvable conflict
        result[k] = v2;
      }
    }
  });

  return result;
};

/**
 * @param {Object} bindings
 * @return {string}
 */
ck.utility.object.flattenBindings = function (bindings) {
  var stringBindings;

  stringBindings = '';

  goog.array.forEach(goog.object.getKeys(bindings), function (key, index) {
    if (index > 0) {
      stringBindings += ', ';
    }
    stringBindings += key + ': ' + bindings[key];
  });

  return stringBindings;
};

/**
 * @param {Object} data
 * @param {string} key
 * @param {string} nextKey
 */
ck.utility.object.rewrite = function (data, key, nextKey) {
  data[nextKey] = data[key];
  delete data[key];
};
