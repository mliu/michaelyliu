goog.provide('ck.format');

goog.require('goog.string');
goog.require('goog.format');
goog.require('goog.date');
goog.require('goog.string.StringBuffer');

/**
 * Shorten a string by adding an ellipsis if needed
 * @param {!string} str_to_truncate
 * @param {!number} max_length - the number of characters to begin truncation at
 * @return {string} a string with a max length of {max_length}
 */
ck.format.shorten_string = function (str_to_truncate, max_length) {

  var half_length,string_buffer, end;

  if (str_to_truncate.length <= max_length){
    return str_to_truncate;
  }else{
    half_length = (max_length -1) / 2;
    string_buffer = new goog.string.StringBuffer();
    string_buffer.append(str_to_truncate.substr(0, Math.ceil(half_length)));
    string_buffer.append('\u2026');
    end = Math.floor(half_length) * -1;
    if (end !== 0) {
      string_buffer.append(str_to_truncate.substr(end));
    }
    return string_buffer.toString();
  }
};

/**
 * Takes unix timestamp and returns goog date
 * @param {!string} timestamp, seconds
 * @return {goog.date.Date}
 */
ck.format.timestamp_to_goog_date = function (timestamp) {

  var date;

  date = new Date(timestamp*1000);
  return new goog.date.Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
};


/**
 * Takes unix timestamp and returns goog datetime.
 * Sometimes backend gives datetime in timestamp
 * @param {!string} timestamp, seconds
 * @return {goog.date.DateTime}
 */
ck.format.timestamp_to_goog_datetime = function (timestamp) {
  return new goog.date.DateTime(new Date(timestamp*1000));
};

/**
 * @param {goog.date.DateTime} date
 * @return {string}
 */
ck.format.format_datetime = function (date) {

  var hours, period;

  period = 'AM';
  hours = date.getHours();
  if (hours >= 12) {
    if (hours !== 12) {
      hours = hours - 12;
    }
    period = 'PM';
  } else if (hours === 0) {
    hours = 12;
  }
  return goog.string.buildString(
    goog.string.padNumber((date.getMonth() + 1), 2),
    '/',
    goog.string.padNumber(date.getDate(), 2),
    '/',
    date.getFullYear(),
    ' ',
    goog.string.padNumber(hours, 2),
    ':',
    goog.string.padNumber(date.getMinutes(), 2),
    ' ',
    period
  );
};

/**
 * Puts a space between the file size and the units.
 * @param {number} bytes
 * @param {number=} opt_decimals
 * @return {string}
 */
ck.format.fileSize = function (bytes, opt_decimals) {

  var gFormatted, end;

  gFormatted = goog.format.fileSize(bytes, opt_decimals);
  end = gFormatted.length - 1;
  if (gFormatted.charAt(end).match(/\d/)) {
    end++;
  }
  return goog.string.buildString(
    gFormatted.substr(0, end),
    '\u00A0',
    gFormatted.charAt(end),
    'B'
  );
};
