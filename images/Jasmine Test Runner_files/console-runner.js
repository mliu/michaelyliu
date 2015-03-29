/**
 Jasmine Reporter that outputs test results to the browser console.
 Useful for running in a headless environment such as PhantomJs, ZombieJs etc.

 Usage:
 // From your html file that loads jasmine:
 jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
 jasmine.getEnv().execute();
*/

(function(jasmine, console) {
  if (!jasmine) {
    throw "jasmine library isn't loaded!";
  }

  var ANSI = {}
  ANSI.color_map = {
      "green" : 32,
      "red"   : 31
  }

  ANSI.colorize_text = function(text, color) {
    var color_code = this.color_map[color];
    return "\033[" + color_code + "m" + text + "\033[0m";
  }

  var ConsoleReporter = function() {
    if (!console || !console.log) { throw "console isn't present!"; }
    this.status = this.statuses.stopped;
  };

  var proto = ConsoleReporter.prototype;
  proto.statuses = {
    stopped : "stopped",
    running : "running",
    fail    : "fail",
    success : "success"
  };

  proto.reportRunnerStarting = function(runner) {
    this.status = this.statuses.running;
    this.start_time = (new Date()).getTime();
    this.executed_specs = 0;
    this.passed_specs = 0;
    this.log("Starting...");
    this.failureTraces = {};
  };

  proto.reportRunnerResults = function(runner) {
    var failed = this.executed_specs - this.passed_specs;
    var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
    var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
    var color = (failed > 0)? "red" : "green";
    var dur = (new Date()).getTime() - this.start_time;

    if (failed > 0) {
      this.log("");
      this.log("Failure Details");
      this.log("-----------------");

      for(var resultText in this.failureTraces) {
        if (this.failureTraces.hasOwnProperty(resultText)) {
          this.log("");
          this.log(resultText, "red");
          this.failureTraces[resultText].forEach(function (trace) {
            var formattedTrace;

            if (!trace.message) {
              formattedTrace = trace;
            } else if (trace.message.length < 512) {
              formattedTrace = trace.message;
            } else {
              formattedTrace = trace.message.substr(0, 512) + "... (truncated)";
            }

            this.log("\t\t" + formattedTrace, "red");
          }, this);
        }
      }
    }

    this.log("");
    this.log("Finished");
    this.log("-----------------");
    this.log(spec_str + fail_str + (dur/1000) + "s.", color);

    this.status = (failed > 0)? this.statuses.fail : this.statuses.success;

    /* Print something that signals that testing is over so that headless browsers
       like PhantomJs know when to terminate. */
    this.log("");
    this.log("ConsoleReporter finished");
  };


  proto.reportSpecStarting = function(spec) {
    this.executed_specs++;
  };

  proto.reportSpecResults = function(spec) {
    if (spec.results().passed()) {
      this.passed_specs++;
      return;
    }

    var resultText = spec.suite.description + " : " + spec.description;
    this.log(resultText, "red");

    var items = spec.results().getItems();

    this.failureTraces[resultText] = [];

    for (var i = 0; i < items.length; i++) {
      var trace = items[i].trace.stack || items[i].trace;
      this.log(trace, "red");
      if (trace) {
        this.failureTraces[resultText].push(trace);
      }
    }
  };

  proto.reportSuiteResults = function(suite) {
    if (suite.parentSuite) {
      return;
    }

    var self = this;
    (function printSuite (suite, numTabs) {
      var description = suite.description;
      if (numTabs === 0) {
        var results = suite.results();
        var failed = results.totalCount - results.passedCount;
        var color = (failed > 0)? "red" : "green";
        self.log(suite.description + ": [" + results.passedCount + " of " + results.totalCount + " passed]", color);
      } else {
        for(var j=0; j<numTabs; j++) {
            description= "\t" + description;
        }
        self.log(description);
      }

      if (suite.children_){
        for(var i=0; i<suite.children_.length; i++) {
          printSuite(suite.children_[i], numTabs + 1);
        }
      }
    })(suite, 0);
    this.log("");
  };

  proto.log = function(str, color) {
    var text = (color != undefined)? ANSI.colorize_text(str, color) : str;
    console.log(text)
  };

  jasmine.ConsoleReporter = ConsoleReporter;
})(jasmine, console);
