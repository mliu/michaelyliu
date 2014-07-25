goog.provide('servo.list');

goog.require('servo.observableArray');

servo.list = function (options) {
  return servo.observableArray(function (value) {
    return value instanceof Array;
  }, options);
};
