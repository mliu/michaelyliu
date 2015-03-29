goog.provide('servo.property');
goog.provide('servo.property.register');

goog.require('servo.bool');
goog.require('servo.date');
goog.require('servo.number');
goog.require('servo.string');
goog.require('servo.file');
goog.require('servo.dictionary');
goog.require('servo.list');

/**
 * @param {string} type
 * @param {Object=} opt_options
 */
servo.property = function (type, opt_options) {
  return {
    create: function () {
      return servo.property.types[type].call(this, opt_options);
    }
  };
};

/**
 * @param {string} type
 * @param {function(Object)} func
 */
servo.property.register = function (type, func) {
  servo.property.types[type] = func;
};

servo.property.types = {
  'bool': servo.bool,
  'date': servo.date,
  'number': servo.number,
  'string': servo.string,
  'file': servo.file,
  'dictionary': servo.dictionary,
  'list': servo.list
};
