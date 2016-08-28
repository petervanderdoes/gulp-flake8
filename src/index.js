// noinspection Eslint
'use strict';

const gulpUtil = require('gulp-util');
const through = require('through2');
const spawn = require('child_process').spawn;
const es = require('event-stream');
const reporters = require('./reporters');

const PLUGIN_NAME = 'gulp-flake8';

const COMMAND_NOT_FOUND = 127;

const formatOutput = result => {
  const errors = result.toString().split('\n');
  if (!errors || !errors.length) {
    return {
      success: true,
    };
  }
  const allErrors = [];
  errors.forEach(error => {
    if (error.length !== 0) {
      const arrayLine = error.split(':');
      const errorObject = {};
      errorObject.filename = arrayLine[0];
      errorObject.row = arrayLine[1];
      errorObject.column = arrayLine[2];
      errorObject.reason = arrayLine[3].trim();
      allErrors.push(errorObject);
    }
  });
  return {
    success: false,
    errorCount: errors.length,
    errorList: allErrors,
  };
};

const gulpFlake8 = paramOptions => {
  // Handle when options is a config file path
  let options = paramOptions;
  if (typeof options === 'string') {
    options = { config: options };
  }
  if (!options) options = {};
  let args = [];
  const config = options.config;
  const bin = options.bin || 'flake8';

  let stream;
  const files = [];
  let flake8Errors = '';

  args = args.concat(bin.split(/\s/));

  args = args.concat(options.args || []);

  if (config) {
    args.push(`--config=${config}`);
  }
  // Flake8 exists with non zero if it finds a lint error.
  args.push('--exit-zero');

  /**
   * If code is non-zero and does not represent a lint error,
   * then returns a PluginError.
   */
  function createExecError(code, executable) {
    let msg;
    let pluginError;
    if (code) {
      if (code === 'ENOENT' || COMMAND_NOT_FOUND === code) {
        msg = `${executable} could not be found`;
      } else {
        msg = `flake8 exited with code ${code}`;
      }
    }
    if (msg) {
      pluginError = new gulpUtil.PluginError(PLUGIN_NAME, msg);
    }

    return pluginError;
  }

  function queueFile(file) {
    // Process a file even if file.contents === null (i.e. file.isNull() === true)
    // since we don't actually care about the file contents.
    if (file) {
      // Hang onto files until the end of the stream so that they can be
      // sent in a batch to scss-lint, which significantly increases
      // performance for large numbers of files.
      if (file.path) {
        files.push(file);
      } else {
        stream.emit('error', new gulpUtil.PluginError(PLUGIN_NAME, 'File provided with no path'));
      }
    }
  }

  /**
   * Spawns the flake8 binary using args with the given filePaths
   * and returns the spawned process.
   */
  function spawnFlake8(filePaths) {
    const execOptions = args.concat(filePaths);
    const spawnBin = execOptions.shift();

    // gulpUtil.log(bin + ' ' + execOptions.join(' '));

    // Run Flake8
    return spawn(spawnBin, execOptions, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', process.stderr],
    });
  }

  function endStream() {
    // Don't run flake8 if there are no files
    if (!files.length) {
      stream.emit('end');
      return;
    }
    const filePaths = files.map(file => file.path);
    filePaths.sort();
    const lint = spawnFlake8(filePaths);
    lint.stdout.on('data', data => {
      flake8Errors += data;
      return flake8Errors;
    });

    // Handle spawn errors
    lint.on('error', error => {
      const execError = createExecError(error.code, bin);
      stream.emit('error', execError);
    });

    // On exit, handle lint output
    lint.on('exit', code => {
      // Check for a non-lint error from the scss-lint binary
      const execError = createExecError(code, bin);
      if (execError) {
        stream.emit('error', execError);
      } else {
        const result = {};
        result.flake8 = formatOutput(flake8Errors);
        stream.emit('data', result);
        stream.emit('end');
      }
      stream.emit('end');
    });
  }

  stream = es.through(queueFile, endStream);
  return stream;
};

gulpFlake8.failOnError = () => through.obj((result, enc, cb) => {
  const count = result.flake8.errorCount;
  if (!count) {
    cb(null, result);
    return;
  }
  cb(new gulpUtil.PluginError(
    'gulp-flake8',
    {
      name: 'Flake8Error',
      message: `Failed with ${count}${(count === 1 ? ' error' : ' errors')}`,
    }
  ));
});

// Expose the reporters
gulpFlake8.originalReporter = reporters.original;
gulpFlake8.reporter = reporters.reporter;

module.exports = gulpFlake8;
