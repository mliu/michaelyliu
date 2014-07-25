// Override JSUnit asserts with Jasmine expect statements to
// give a better message on legacy test failure.

beforeEach(function () {
  assertContains = function () {
    if (arguments.length === 3) {
      expect(arguments[2]).toContain(arguments[1]);
    }
    else {
      expect(arguments[1]).toContain(arguments[0]);
    }
  };
  
  assertEquals = function () {
    if (arguments.length === 3) {
      expect(arguments[1]).toEqual(arguments[2]);
    }
    else {
      expect(arguments[0]).toEqual(arguments[1]);
    }
  };
  
  assertTrue = function () {
    if (arguments.length === 2) {
      expect(arguments[1]).toBe(true);
    }
    else {
      expect(arguments[0]).toBe(true);
    }
  };

  assertFalse = function () {
    if (arguments.length === 2) {
      expect(arguments[1]).toBe(false);
    }
    else {
      expect(arguments[0]).toBe(false);
    }
  };

  assertEvaluatesToTrue = function () {
    if (arguments.length === 2) {
      expect(arguments[1]).toBeTruthy();
    }
    else {
      expect(arguments[0]).toBeTruthy();
    }
  };

  assertObjectEquals = assertEquals;

});