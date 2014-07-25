goog.provide('servo.bool');

goog.require('servo.observable');

servo.bool = function (options) {
  return servo.observable(function (value) {
    return typeof value === 'boolean';
  }, options);
};
