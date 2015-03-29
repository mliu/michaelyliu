goog.provide('ck.AnchoredPositionCenter');

goog.require('goog.math.Coordinate');
goog.require('goog.positioning');
goog.require('goog.positioning.AbstractPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.style');

/**
 * Same as goog.positioning.AnchoredPosition but positions the element
 * to the center of the target instead of forcing use of a corner.
 * Centering is relative to the side of the target element indicated by the
 * 'orientation' parameter. Calling code is responsible for ensuring the desired
 * movable element corner is set properly when calling reposition() in order for
 * centering to work properly.
 *
 * @param {Element} anchorElement Element the movable element should be
 *     anchored against.
 * @param {ck.AnchoredPositionCenter.Orientation} orientation Where the
 *     movable element should be positioned relative to the anchored element.
 * @param {number=} opt_xoffset Optional x-offset to add after centering.
 * @param {number=} opt_yoffset Optional y-offset to add after centering.
 * @constructor
 * @extends {goog.positioning.AbstractPosition}
 */
ck.AnchoredPositionCenter = function(anchorElement, orientation, opt_xoffset,
opt_yoffset) {
  /**
   * Element the movable element should be anchored against.
   * @type {Element}
   */
  this.element = anchorElement;
  /**
   * Corner of anchored element the movable element should be positioned at.
   * @type {goog.positioning.Corner}
   */
  this.corner = this.orientationToCorner(orientation);
  /**
   * @type {ck.AnchoredPositionCenter.Orientation}
   * @private
   */
  this.orientation_ = orientation;
  if (goog.isNumber(opt_xoffset)) {
    this.xoffset_ = opt_xoffset;
  }
  if (goog.isNumber(opt_yoffset)) {
    this.yoffset_ = opt_yoffset;
  }
};
goog.inherits(ck.AnchoredPositionCenter, goog.positioning.AbstractPosition);

/**
 * @enum {string}
 */
ck.AnchoredPositionCenter.Orientation = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * @type {number}
 * @private
 */
ck.AnchoredPositionCenter.prototype.xoffset_ = 0;

/**
 * @type {number}
 * @private
 */
ck.AnchoredPositionCenter.prototype.yoffset_ = 0;

/**
 * Repositions the movable element.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 * @param {goog.math.Size=} opt_preferredSize PreferredSize of the
 *     movableElement (unused in this class).
 */
ck.AnchoredPositionCenter.prototype.reposition =
  function(movableElement, movableCorner, opt_margin, opt_preferredSize) {
  this.translateOffsetsForCorner_(movableCorner);
  goog.positioning.positionAtAnchor(this.element,
                                    this.corner,
                                    movableElement,
                                    movableCorner,
                                    this.calculateOffset(),
                                    opt_margin);
};

/**
 * Determines the offset relative to the target element
 * to use when positioning the movable element.
 * @return {goog.math.Coordinate}
 */
ck.AnchoredPositionCenter.prototype.calculateOffset = function() {
  var rect, xoffset, yoffset;
  rect = goog.style.getBounds(this.element);
  yoffset = 0;
  xoffset = 0;
  if (this.isVertical_()) {
    yoffset = this.halve_(rect.height, this.yoffset_);
  } else {
    // horizontal positioning
    xoffset = this.halve_(rect.width, this.xoffset_);
  }
  return new goog.math.Coordinate(xoffset, yoffset);
};

/**
 * @param {ck.AnchoredPositionCenter.Orientation} orientation
 * @return {goog.positioning.Corner}
 */
ck.AnchoredPositionCenter.prototype.orientationToCorner =
function (orientation) {
  if (orientation === ck.AnchoredPositionCenter.Orientation.TOP) {
    return goog.positioning.Corner.TOP_LEFT;
  } else if (orientation === ck.AnchoredPositionCenter.Orientation.RIGHT) {
    return goog.positioning.Corner.TOP_RIGHT;
  } else if (orientation === ck.AnchoredPositionCenter.Orientation.BOTTOM) {
    return goog.positioning.Corner.BOTTOM_LEFT;
  } else if (orientation === ck.AnchoredPositionCenter.Orientation.LEFT) {
    return goog.positioning.Corner.TOP_LEFT;
  }

  // default
  return goog.positioning.Corner.BOTTOM_LEFT;
};

/**
 * Determines if the positiong adjustments should be made vertically.
 * @return {boolean} true if vertical, false if horizontal.
 */
ck.AnchoredPositionCenter.prototype.isVertical_ = function () {
  return (this.orientation_ === ck.AnchoredPositionCenter.Orientation.LEFT ||
    this.orientation_ === ck.AnchoredPositionCenter.Orientation.RIGHT);
};

/**
 * Adjust the offsets based on the movable element's corner.
 * @param {goog.positioning.Corner} movableCorner
 */
ck.AnchoredPositionCenter.prototype.translateOffsetsForCorner_ =
function (movableCorner) {
  if (this.isVertical_()) {
  // Only adjust y-offset if positioning vertically.
    if (movableCorner === goog.positioning.Corner.TOP_LEFT ||
      movableCorner === goog.positioning.Corner.TOP_RIGHT) {
      this.yoffset_ = 0 - Math.abs(this.yoffset_);
    } else if (movableCorner === goog.positioning.Corner.BOTTOM_LEFT ||
      movableCorner === goog.positioning.Corner.BOTTOM_RIGHT) {
      this.yoffset_ = Math.abs(this.yoffset_);
    }
  } else {
  // Only adjust x-offset if positioning horizontally.
    if (movableCorner === goog.positioning.Corner.TOP_LEFT ||
      movableCorner === goog.positioning.Corner.BOTTOM_LEFT) {
      this.xoffset_ = 0 - Math.abs(this.xoffset_);
    } else if (movableCorner === goog.positioning.Corner.TOP_RIGHT ||
      movableCorner === goog.positioning.Corner.BOTTOM_RIGHT) {
      this.xoffset_ = Math.abs(this.xoffset_);
    }
  }
};

/**
 * Halves the length and then subtracts the offset.
 * @param {!number} length
 * @param {!number} offset
 * @return {number}
 */
ck.AnchoredPositionCenter.prototype.halve_ =
function (length, offset) {
  if (!goog.isNumber(length) || length <= 0) {
    return 0;
  }
  return Math.floor(length/2) + offset;
};
