function hijackJasmineWithRandomTestOrder() {
  jasmine.Queue.seed = window.location.href.match(/seed=(\d+)/) || [];
  jasmine.Queue.pseudoRandom = new goog.testing.PseudoRandom(jasmine.Queue.seed[1]);
  document.body.appendChild(document.createTextNode("Seed: " + jasmine.Queue.pseudoRandom.seed_));
  console.info("Seed: " + jasmine.Queue.pseudoRandom.seed_);

  jasmine.Queue.prototype.start = function (onComplete) {
    this.blocks = this.reorderBlocks(this.blocks);
    this.running = true;
    this.onComplete = onComplete;
    this.next_();
  };

  jasmine.Queue.prototype.reorderBlocks = function (blocks) {
    var groupedBlocks = blocks.reduce(function (accumulator, block) {
      var functionTypeName = 'test';
      if (block.func && block.func.typeName) {
        functionTypeName = block.func.typeName;
      }

      if (!accumulator[functionTypeName]) {
        accumulator[functionTypeName] = [];
      };

      accumulator[functionTypeName].push(block);
      return accumulator;
    }, {});

    return [].concat(
        groupedBlocks.beforeEach,
        this.reorderTests(groupedBlocks.test),
        groupedBlocks.afterEach
      ).filter(this.isDefAndNotNull);
  };

  jasmine.Queue.prototype.reorderTests = function (tests) {
    return (tests || []).sort(this.randomSort);
  };

  jasmine.Queue.prototype.randomSort = function (a, b) {
    return Math.round(jasmine.Queue.pseudoRandom.random()) - 0.5;
  };

  jasmine.Queue.prototype.isDefAndNotNull = function (obj) {
    return obj != null;
  };
}

if (window.location.href.match(/random=true/)) {
  hijackJasmineWithRandomTestOrder();
}
