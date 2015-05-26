# gulp-bower
 
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

> Reads .bower.json files and pipes out the defined main files whilst obeying dependency order

## Installation

Install 'gulp-bower' as a development dependency:

```shell
npm install --save-dev gulp-bower-mf
```

## Basic Usage

```javascript
var gulp = require('gulp')
var bower = require('gulp-bower-mf')

gulp.task('process-bower-files', function () {
	return gulp.src('./bower_components/**/.bower.json')
		.pipe(bower())
		.pipe(gulp.dest('./public')
})
```

[npm-url]: https://npmjs.org/package/gulp-bower-mf
[npm-image]: https://badge.fury.io/js/gulp-bower-mf.svg

[travis-url]: http://travis-ci.org/MasterOfPoppets/gulp-bower
[travis-image]: https://secure.travis-ci.org/MasterOfPoppets/gulp-bower.svg?branch=master

[depstat-url]: https://david-dm.org/masterofpoppets/gulp-bower
[depstat-image]: https://david-dm.org/masterofpoppets/gulp-bower.svg
