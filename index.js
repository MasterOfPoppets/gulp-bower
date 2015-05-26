var	fs = require('fs'),
	gutil = require('gulp-util'),
	toposort = require('toposort'),
	through = require('through2')

module.exports = function (options) {
	var bowerFiles = {}

	function transform(chunk, encoding, next) {
		var bowerFile = JSON.parse(chunk.contents.toString('utf8'))
		bowerFiles[bowerFile.name] = bowerFile
		next()
	}

	function flush(done) {
		var self = this,
			dependencyGraph = [],
			standaloneModules = []

		Object.keys(bowerFiles).forEach(function (module) {
			var bowerFile = bowerFiles[module]
			if (bowerFile.dependencies) {
				var moduleDependencyKeys = Object.keys(bowerFile.dependencies)

				moduleDependencyKeys.forEach(function (moduleDependencyKey) {
					dependencyGraph.push([bowerFile.name, moduleDependencyKey])
				})
			} else {
				standaloneModules.push(bowerFile.name)
			}
		})

		var orderedDependencies = toposort(dependencyGraph).reverse()
		orderedDependencies.forEach(function (dependency) {
			var standaloneModuleIndex = standaloneModules.indexOf(dependency)
			if (standaloneModuleIndex !== -1) {
				standaloneModules.splice(standaloneModuleIndex, 1)
			}
		})
		orderedDependencies = standaloneModules.concat(orderedDependencies)

		orderedDependencies.forEach(function (module) {
			var bowerFile = bowerFiles[module]
			var mainFiles = bowerFile.main
			if (typeof mainFiles === 'string') {
				mainFiles = [mainFiles]
			}
			mainFiles.forEach(function (filepath) {
				if (options.excluded.indexOf(bowerFile.name) === -1) {
					self.push(new gutil.File({
						path: bowerFile.name + '/' + filepath,
						contents: fs.readFileSync('bower_components/' + bowerFile.name + '/' + filepath)
					}))
				}
			})
		})

		done()
	}

	return through.obj(transform, flush)
}