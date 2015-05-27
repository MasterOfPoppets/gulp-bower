var chai = require('chai'),
	path = require('path'),
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

	it('should pipe out main files in dependency order', function (done) {
		gulp.src('./test/fixtures/**/*.json')
			.pipe(bower())
			.pipe(assert.length(2))
			.pipe(assert.first(function (data) {
				data.contents.toString().should.equal('console.log(\'file2\')')
			}))
			.pipe(assert.end(done))
	})
})