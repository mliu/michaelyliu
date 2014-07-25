jasmine.BuildbotReporter = function() {
  this.text = '';
};

jasmine.BuildbotReporter.prototype.addMessage = function (message) {
  this.text += message + '\n\n';
};

jasmine.BuildbotReporter.prototype.reportSpecResults = function (spec) {
  var results = spec.results();
  var reporter = this;

  if (!results.passed()) {
    results.getItems().forEach(function (item) {
      if (!item.passed()) {
        reporter.addMessage(spec.suite.description + ':\n\t' +
                            results.description + ':\n\t\t' +
                            item.message);
      }
    });
  }
};

jasmine.BuildbotReporter.prototype.reportRunnerResults = function () {
  var container, body;

  container = document.createElement('div');
  container.setAttribute('id', 'buildbot-results');
  container.textContent = this.text;

  body = document.getElementsByTagName('body')[0];
  body.appendChild(container);
};
