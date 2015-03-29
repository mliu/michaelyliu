/*global window: true */

if (!window.console) {
  var console = {};
  console.log = function () {};
}
gettext = function (msg) { return msg; };

function ngettext(singular, plural, count) {
  return (parseInt(count, 10) === 1) ? singular : plural;
}

