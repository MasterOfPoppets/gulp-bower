var chai = require('chai'),
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	assert = require('stream-assert'),
	bower = require('../index.js')

chai.should()

describe('gulp-bower', function () {
	it('should ignore null files', function (done) {
		var stream = bower()

		stream
			.pipe(assert.length(0))
			.pipe(assert.end(done))

		stream.write(new gutil.File)
		stream.end()
	})
})