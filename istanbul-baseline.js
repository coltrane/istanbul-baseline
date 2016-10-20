"use strict";

const process = require('process');
const fs = require('fs');
const path = require('path');
const istanbul = require('istanbul');
const glob = require('glob');
const mkdirp = require('mkdirp');
const minimist = require('minimist');
const co = require('co');

/**
 * BaselineCollector is taken directly from
 * 'istanbul/lib/commands/instrument.js', with only minor changes.
 */
class BaselineCollector {
    constructor(instrumenter) {
        this.instrumenter = instrumenter;
        this.collector = new istanbul.Collector();
        this.instrument = instrumenter.instrument.bind(this.instrumenter);

        var origInstrumentSync = instrumenter.instrumentSync;
        this.instrumentSync = function() {
            var args = Array.prototype.slice.call(arguments),
                ret = origInstrumentSync.apply(this.instrumenter, args),
                baseline = this.instrumenter.lastFileCoverage(),
                coverage = {};
            coverage[baseline.path] = baseline;
            this.collector.add(coverage);
            return ret;
        };
        //monkey patch the instrumenter to call our version instead
        instrumenter.instrumentSync = this.instrumentSync.bind(this);
    }

    getCoverage() {
        return this.collector.getFinalCoverage();
    }
}

function writeJSON(obj, file) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, JSON.stringify(obj), 'utf8', function(err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}


function expandArg(arg) {
    if (glob.hasMagic(arg)) {
        return glob.sync(arg);
    }
    return [arg];
}

function concat(a, b) {
    return a.concat(b);
}

function reportError(err) {
    setImmediate(function() {
        // force the error into node's unhandled-exception handler
        throw err;
    });
}

function message(txt) {
    process.stderr.write(`${txt}\n`);
}

co(function *() {
    let cwd = process.cwd();
    let argv = minimist(process.argv.slice(2));

    let baselineFile = "coverage/coverage-baseline.json";
    if(argv.output) {
        baselineFile = argv.output;
    }

    let instrumenter = new BaselineCollector(new istanbul.Instrumenter());
    let files = argv._
        .map(expandArg).reduce(concat, []);
    files.forEach(file => {
        file = path.resolve(cwd, file);
        instrumenter.instrumentSync(fs.readFileSync(file, 'utf8'), file);
    });

    baselineFile = path.resolve(cwd, baselineFile);
    mkdirp.sync(path.dirname(baselineFile));

    yield writeJSON(instrumenter.getCoverage(), baselineFile);

    message(`istanbul-baseline:\n  ${files.length} files. \n  ${baselineFile}`);

}).catch(reportError);

