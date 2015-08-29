var _ = require('highland');
var fs = require('fs');
var gutil = require('gulp-util');
var toposort = require('toposort');
var through = require('through2');

module.exports = function (passedOptions) {
	var stream;
	var options = passedOptions || {};
	var fileDescriptors = [];

	stream = through.obj(transform, flush);

	function transform(file, encoding, next) {
		if (file.isNull()) {
			next();
			return;
		}

		fileDescriptors.push(file);
		next();
	}

	function flush(done) {
		parsedFiledDescriptors()
			.flatMap(function createDependencyGraph(file) {
				return _.keys(_.get('dependencies', file))
					.map(function (dependency) {
						return [file.name, dependency];
					});
			})
			.collect()
			.map(function orderDependencies(dependencyGraph) {
				return toposort(dependencyGraph).reverse();
			})
			.doto(findMissingDependencies)
			.each(pushFiles);

		done();

		function parsedFiledDescriptors() {
			return _(fileDescriptors)
				.through(parseAllFileContents);
		}

		function parseAllFileContents(allFiles) {
			return allFiles
				.map(_.get('contents'))
				.map(function (contents) {
					return contents.toString('utf8');
				})
				.map(JSON.parse);
		}

		function findMissingDependencies(orderedDependencies) {
			_(orderedDependencies)
				.each(function (dependency) {
					return parsedFiledDescriptors()
						.map(_.get('name'))
						.collect()
						.filter(function (allFileNames) {
							return allFileNames.indexOf(dependency) === -1;
						})
						.each(function (fileMissingDependency) {
							stream.emit('error', new gutil.PluginError(
								'gulp-bower-mf',
								'Missing dependency ' + dependency + ' for library ' + fileMissingDependency
							));
						});
				});
		}

		function pushFiles(orderedDependencies) {
			_(fileDescriptors)
				.flatMap(function extractFileMeta(file) {
					return _([file])
						.through(parseAllFileContents)
						.map(function (fileContents) {
							return {
								base: file.base,
								name: fileContents.name,
								main: fileContents.main
							};
						});
				})
				.sortBy(function sortFilesIntoDependencyOrder(a, b) {
					return orderedDependencies.indexOf(a.name) > orderedDependencies.indexOf(b.name);
				})
				.each(function pushFile(fileMeta) {
					_(typeof fileMeta.main === 'string' ? [fileMeta.main] : fileMeta.main)
						.filter(function filterExcluded() {
							return !options.excluded || options.excluded.indexOf(fileMeta.name) === -1;
						})
						.each(function (mainFile) {
							var file = fileMeta.base + fileMeta.name.toLowerCase() + '/' + mainFile;

							stream.push(new gutil.File({
								path: file,
								contents: fs.readFileSync(file)
							}));
						});
				});
		}
	}

	return stream;
};
