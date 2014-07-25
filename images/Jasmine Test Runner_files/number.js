goog.provide('servo.number');

goog.require('servo.observable');

servo.number = function (options) {
  return servo.observable(function (value) {
    return typeof value === 'number';
  }, options);
};
