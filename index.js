var	_ = require('highland'),
	fs = require('fs'),
	gutil = require('gulp-util'),
	toposort = require('toposort'),
	through = require('through2')

module.exports = function (options) {
	var stream,
		options = options || {},
		fileDescriptors = []

	stream = through.obj(transform, flush)

	function transform(file, encoding, next) {
		if (file.isNull()) {
			next()
			return
		}

		fileDescriptors.push(file)
		next()
	}

	function flush(done) {
		_(fileDescriptors)
			.through(parseAllFileContents)
			.flatMap(function (file) {
				return _.pairs(_.get('dependencies', file))
					.map(function (dependency) {
						return [file.name, dependency[0]]
					})
			})
			.toArray(pushFiles)

		function parseAllFileContents(allFiles) {
			return allFiles
				.map(_.get('contents'))
				.map(function (contents) {
					return contents.toString('utf8')
				})
				.map(JSON.parse)
		}

		function pushFiles(dependencyGraph) {
			var orderedDependencies = toposort(dependencyGraph).reverse()

			_(orderedDependencies)
				.each(function (dep) {
					_(fileDescriptors)
						.through(parseAllFileContents)
						.map(function (fileContents) {
							return fileContents.name
						})
						.toArray(function (x) {
							if (x.indexOf(dep) === -1) {
								stream.emit('error', new gutil.PluginError('gulp-bower-mf', 'Missing dependency ' + dep))
							}
						})
				})

			_(fileDescriptors)
				.flatMap(function (file) {
					console.log(file.history)
					return _([file])
						.through(parseAllFileContents)
						.map(function (fileContents) {
							return { path: file.path, name: fileContents.name, main: fileContents.main }
						})
				})
				.sortBy(function (a, b) {
					return orderedDependencies.indexOf(a.name) > orderedDependencies.indexOf(b.name)
				})
				.each(pushFile)
		}

		function pushFile(fileMeta) {
			var mainFiles = typeof fileMeta.main === 'string' ? [fileMeta.main] : fileMeta.main

			mainFiles.forEach(function (mainFile) {
				if (!options.excluded || options.excluded.indexOf(fileMeta.name) === -1) {
					var path = fileMeta.path
					var pathSubStr = path.substr(0, path.indexOf(fileMeta.name))
					var file = pathSubStr + fileMeta.name + '/' + mainFile

					stream.push(new gutil.File({
						path: file,
						contents: fs.readFileSync(file)
					}))
				}
			})
		}

		done()
	}

	return stream
}