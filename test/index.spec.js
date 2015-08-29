var chai = require('chai');
var gulp = require('gulp');
var gutil = require('gulp-util');
var assert = require('stream-assert');
var bower = require('../index.js');

chai.should();

describe('gulp-bower', function () {
	it('should ignore null files', function (done) {
		var stream = bower();

		stream
			.pipe(assert.length(0))
			.pipe(assert.end(done));

		stream.write(new gutil.File());
		stream.end();
	});

	it('should pipe out main files in dependency order', function (done) {
		gulp.src('./test/fixtures/standard/**/*.json')
			.pipe(bower())
			.pipe(assert.length(2))
			.pipe(assert.first(function (data) {
				data.contents.toString().should.contain('console.log(\'file2\');');
			}))
			.pipe(assert.end(done));
	});

	it('should pipe out main files without excluded components', function (done) {
		gulp.src('./test/fixtures/standard/**/*.json')
			.pipe(bower({
				excluded: ['testFile1']
			}))
			.pipe(assert.length(1))
			.pipe(assert.end(done));
	});

	it('should pipe out all the main files for a given component', function (done) {
		gulp.src('./test/fixtures/multiple_main_files/**/*.json')
			.pipe(bower())
			.pipe(assert.length(2))
			.pipe(assert.end(done));
	});

	it('should emit an error if a dependency is not available', function (done) {
		gulp.src('./test/fixtures/missing_dependency/**/*.json')
			.pipe(bower())
			.on('error', function (error) {
				error.message.should.equal('Missing dependency testFile2 for library testFile1');
				done();
			});
	});

	it('should cope with non-standard package names', function (done) {
		gulp.src('./test/fixtures/non_standard_package_name/**/*.json')
			.pipe(bower())
			.pipe(assert.length(1))
			.pipe(assert.end(done));
	});
});
