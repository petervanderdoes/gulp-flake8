# gulp-flake8

> [Flake8](https://gitlab.com/pycqa/flake8) plugin for [gulp](http://gulpjs.com).

[Flake8](https://gitlab.com/pycqa/flake8) is a python tool that glues together
pep8, pyflakes, mccabe, and third-party plugins to check the style and
quality of some python code.
This plugin wraps the flake8 binary for gulp and provides fancy and original reporters.


## Install

    npm install gulp-flake8-avh --save-dev

This plugin requires [flake8](http://flake8.pycqa.org/en/latest/#installation)
to be installed.

From a terminal:

```sh
python -m pip install flake8
```

## Usage

```javascript
gulp.task('lint-python', function () {
  return gulp.src(['**/*py',
    '!**/build/**',
    '!**/dist/**',
    '!**/node_modules/**'])
    .pipe(flake8())
    .pipe(flake8.reporter())
    .pipe(flake8.failOnError());
});
```
### Important

You need to include/exclude files and directories through the ``gulp.src``
option. Due to the way this plugin and flake8 works, it won't respect the
exclude option in the flake8 configuration.

## API

### flake8(configFile)

#### configFile
Type: `String`

You can pass the path to your flake8 config file directly to the plugin,
though if your config file uses the standard file name and location
then flake8 will find it by default.

```javascript
gulp.src('**/*py')
  .pipe(flake8('.flake8'))
```

### flake8(options)

#### options
Type: `Object`

For example:

```javascript
scsslint({
  config: '.flake8',
  bin: 'flake8',
  args: ['--ignore=W503'] // see caveat below
})
```

##### options property: `config`
Type: `String`

Path to your flake8 config file.  Default is `undefined`.

##### options property: `bin`
Type: `String`

The flake8 call signature.  Default is `flake8`.

##### options property: `args`
Type: `Array`

An array of additional arguments supported by `flake8`.  See
`flake8 --help` for options.

For example:
```javascript
args: ['--ignore=W503']
```

**N.B.**: Flake8 works best using a configuration file. This is just an 
personal observation.

### flake8.reporter(format)

##### format
Type: `String`

The format of the report. The plugin comes with two build-in options:
- original
- fancy

Default is `original`

###### original
The same format like `flake8`

Example:
```javascript
stuff
  .pipe(flake8())
  .pipe(flake8.reporter())
```
Example Output:

```
./__main__.py 17:1: F401 'os' imported but unused
./sample/config/apps.py 25:9: F401 'sample.config.signals' imported but unused
./sample/config/urls.py 26:4: E121 continuation line under-indented for hanging indent
./sample/config/urls.py 34:4: E121 continuation line under-indented for hanging indent
./sample/config/urls.py 44:4: E121 continuation line under-indented for hanging indent
./sample/core/apps.py 25:9: F401 'sample.core.signals' imported but unused
```

###### fancy
A colored output and if a file has multiple errors, the filename is only 
displayed on the first error.

Example:
```javascript
stuff
  .pipe(flake8())
  .pipe(flake8.reporter('fancy'))
```
Example output:

```
__main__.py 17:1 F401 'os' imported but unused
sample/config/apps.py 25:9 F401 'sample.config.signals' imported but unused
sample/config/urls.py 26:4 E121 continuation line under-indented for hanging indent
                      34:4 E121 continuation line under-indented for hanging indent
                      44:4 E121 continuation line under-indented for hanging indent
sample/core/apps.py 25:9 F401 'sample.core.signals' imported but unused
```

### flake8.failOnError()
Stop a task/stream if a ``flake8`` error has been reported for any file.

```javascript
gulp.task('lint-python', function () {
  return gulp.src('**/*py')
    .pipe(flake8())
    .pipe(flake8.failOnError());
});
```

## Result
Type: ``Object``

The following properties are set to the result object:

```javascript
  result.flake8.success = true; // or false
  result.flake8.errorCount = 0; // number of errors returned by Flake8
  result.flake8.errorList = []; // Flake8 errors
```

The objects in `errorList` all have the following properties

```javascript
result.flake8.errorList = [{
  'filename': 'full path of the filename',
  'row': 10,
  'column': 4,
  'reason': 'a description of the error'
}]
```

## Custom Reporters

Custom reporter functions can be passed as ``flake8.reporter(reporterFunc)``.
The reporter function will be called for each linted file that includes
an error or warning and will be passed the ``result`` object as described above.

```javascript
var flake8 = require('@petervanderdoes/gulp-flake8');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');

var myReporter = function(file) {
  gulpUtil.log(result.flake8.errorCount + ' errors');
};

gulp.task('lint', function() {
  return gulp.src('*.py')
    .pipe(flake8())
    .pipe(flake8.reporter(myReporter));
});
```

See `src/reports.js` for more detailed examples.

## 
This plugin was inspired by the following gulp plugins:
- [gulp-scsslint](https://github.com/noahmiller/gulp-scsslint)
- [gulp-eslint](https://github.com/adametry/gulp-eslint)