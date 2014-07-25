// From https://github.com/larrymyers/jasmine-reporters with minor modifications
//
//The MIT License
//
//Copyright (c) 2010 Larry Myers
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

(function() {

    if (! jasmine) {
        throw new Exception("jasmine library does not exist in global namespace!");
    }

    function elapsed(startTime, endTime) {
        return (endTime - startTime)/1000;
    }

    function ISODateString(d) {
        function pad(n) { return n < 10 ? '0'+n : n; }

        return d.getFullYear() + '-' +
            pad(d.getMonth()+1) + '-' +
            pad(d.getDate()) + 'T' +
            pad(d.getHours()) + ':' +
            pad(d.getMinutes()) + ':' +
            pad(d.getSeconds());
    }

    function trim(str) {
        return str.replace(/^\s+/, "" ).replace(/\s+$/, "" );
    }

    function escapeInvalidXmlChars(str) {
        return str.replace(/\&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/\>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/\'/g, "&apos;");
    }

    /**
     * Generates JUnit XML for the given spec run.
     * Allows the test results to be used in java based CI
     * systems like CruiseControl and Hudson.
     *
     * @param {boolean} useDotNotation whether to separate suite names with
     *                  dots rather than spaces (ie "Class.init" not
     *                  "Class init"); default: true
     */
    var JUnitXmlReporter = function(useDotNotation) {
        this.useDotNotation = useDotNotation === jasmine.undefined ? true : useDotNotation;
    };
    JUnitXmlReporter.finished_at = null; // will be updated after all files have been written

    JUnitXmlReporter.prototype = {
        reportSpecStarting: function(spec) {
            spec.startTime = new Date();

            if (!spec.suite.startTime) {
                spec.suite.startTime = spec.startTime;
            }
        },

        reportSpecResults: function(spec) {
            var results = spec.results();
            spec.didFail = !results.passed();
            spec.duration = elapsed(spec.startTime, new Date());
            spec.output = '<testcase classname="' + this.getFullName(spec.suite) +
                '" name="' + escapeInvalidXmlChars(spec.description) + '" time="' + spec.duration + '">';

            var failure = "";
            var failures = 0;
            var resultItems = results.getItems();
            for (var i = 0; i < resultItems.length; i++) {
                var result = resultItems[i];

                if (result.type == 'expect' && result.passed && !result.passed()) {
                    failures += 1;
                    failure += (failures + ": " + escapeInvalidXmlChars(result.message) + " ");
                }
            }
            if (failure) {
                spec.output += "<failure>" + trim(failure) + "</failure>";
            }
            spec.output += "</testcase>";
        },

        reportSuiteResults: function(suite) {
            var results = suite.results();
            var specs = suite.specs();
            var specOutput = "";
            // for JUnit results, let's only include directly failed tests (not nested suites')
            var failedCount = 0;

            suite.status = results.passed() ? 'Passed.' : 'Failed.';
            if (results.totalCount === 0) { // todo: change this to check results.skipped
                suite.status = 'Skipped.';
            }

            // if a suite has no (active?) specs, reportSpecStarting is never called
            // and thus the suite has no startTime -- account for that here
            suite.startTime = suite.startTime || new Date();
            suite.duration = elapsed(suite.startTime, new Date());

            for (var i = 0; i < specs.length; i++) {
                failedCount += specs[i].didFail ? 1 : 0;
                specOutput += "\n  " + specs[i].output;
            }
            suite.output = '\n<testsuite name="' + this.getFullName(suite) +
                '" errors="0" tests="' + specs.length + '" failures="' + failedCount +
                '" time="' + suite.duration + '" timestamp="' + ISODateString(suite.startTime) + '">';
            suite.output += specOutput;
            suite.output += "\n</testsuite>";
        },

        reportRunnerResults: function(runner) {
            var suites = runner.suites();
            var suitesOutput = '';
            var output = '<?xml version="1.0" encoding="UTF-8" ?>';
            output += '\n<testsuites>';

            for (var i = 0; i < suites.length; i++) {
                var suite = suites[i];
                output += this.getNestedOutput(suite);
            }
            output += '\n</testsuites>';

            this.writeResultsToDocument(output);
            // When all done, make it known on JUnitXmlReporter
            JUnitXmlReporter.finished_at = (new Date()).getTime();
        },

        getNestedOutput: function(suite) {
            var output = suite.output;
            for (var i = 0; i < suite.suites().length; i++) {
                output += this.getNestedOutput(suite.suites()[i]);
            }
            return output;
        },

        writeResultsToDocument: function(text) {

          var container, body;
          container = document.createElement('div');
          container.setAttribute('id', 'junit-results');
          if (document.all){
            container.innerText = text;
          } else {
            container.textContent = text;
          }
          body = document.getElementsByTagName("body")[0];
          body.appendChild(container);
        },

        getFullName: function(suite, isFilename) {
            var fullName;
            if (this.useDotNotation) {
                fullName = suite.description;
                for (var parentSuite = suite.parentSuite; parentSuite; parentSuite = parentSuite.parentSuite) {
                    fullName = parentSuite.description + '.' + fullName;
                }
            }
            else {
                fullName = suite.getFullName();
            }

            // Either remove or escape invalid XML characters
            if (isFilename) {
                return fullName.replace(/[^\w]/g, "");
            }
            return escapeInvalidXmlChars(fullName);
        },

        log: function(str) {
            var console = jasmine.getGlobal().console;

            if (console && console.log) {
                console.log(str);
            }
        }
    };

    // export public
    jasmine.JUnitXmlReporter = JUnitXmlReporter;
})();
