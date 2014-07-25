goog.provide('ck.utility.FileInput');


/**
 * @enum {string}
 */
ck.utility.FileInput.MIME_TYPE = {
  'bmp': 'image/bmp',
  'jpe': 'image/jpeg',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'pdf': 'application/pdf',
  'txt': 'text/plain',
  'doc': 'application/msword',
  'xls': 'application/vnd.ms-excel',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

/**
 * @param {Element} fileInput
 * @return {string}
 */
ck.utility.FileInput.getContentType = function (fileInput) {
  var file, fileType;

  if (fileInput.files) {
    file = fileInput.files[0];
    return file ? file.type : '';
  }

  fileType = fileInput.value.split('.').reverse()[0];
  return /** @type {string} */ (goog.object.get(ck.utility.FileInput.MIME_TYPE, fileType, ''));
};

/**
 * @param {Element} fileInput
 * @return {string}
 */
ck.utility.FileInput.getName = function (fileInput) {
  var file, fileName;

  if (fileInput.files) {
    file = fileInput.files[0];
    return file ? file.name : '';
  }

  fileName = fileInput.value;
  return fileName.replace(/\\/g, '/').split('/').reverse()[0];
};

/**
 * @param {Element} fileInput
 * @return {Object|null}
 */
ck.utility.FileInput.getFileFromElement = function (fileInput) {
  var file;

  if (!ck.utility.FileInput.hasSelectedFile(fileInput)) {
    return null;
  }

  file = {
    'name': ck.utility.FileInput.getName(fileInput),
    'type': ck.utility.FileInput.getContentType(fileInput),
    'size': ((fileInput.files && fileInput.files.length > 0) ?
      fileInput.files[0].size :
      null
    )
  };

  return file;
};

/**
 * @param {Element} fileInput
 * @return {boolean}
 */
ck.utility.FileInput.hasSelectedFile = function (fileInput) {
  if (fileInput.hasOwnProperty && fileInput.hasOwnProperty('files')) {
    return fileInput.files.length !== 0;
  }
  return fileInput.value !== '';
};
