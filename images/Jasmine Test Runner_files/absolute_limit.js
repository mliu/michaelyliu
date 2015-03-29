goog.provide('ck.data.AbsoluteLimit');

goog.require('servo.Collection');
goog.require('servo.Model');
goog.require('servo.Number');
goog.require('servo.Property');

ck.data.AbsoluteLimit = servo.createModel({
  'limit': servo.createProperty(servo.Number),
  'remaining': servo.createProperty(servo.Number, true, null)
}, servo.Store);
