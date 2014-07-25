goog.provide('servo.dictionary');

goog.require('servo.observable');

servo.dictionary = function (options) {
  return servo.observable(function (value) {
    return value instanceof Object;
  }, options);
};
