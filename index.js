var Transform = require('stream').Transform,
	util = require('util'),
	fs = require('fs'),
	gutil = require('gulp-util'),
	toposort = require('toposort')

var BowerStream = function (options) {
	this.bowerFiles = {}
	this.options = options || {}
	this.options.objectMode = true

	Transform.call(this, options)
}
util.inherits(BowerStream, Transform)

BowerStream.prototype._transform = function (chunk, encoding, next) {
	var bowerFile = JSON.parse(chunk.contents.toString('utf8'))
	this.bowerFiles[bowerFile.name] = bowerFile
	next()
}

BowerStream.prototype._flush = function () {
	var self = this,
		dependencyGraph = [],
		standaloneModules = []

	Object.keys(self.bowerFiles).forEach(function (module) {
		var bowerFile = self.bowerFiles[module]
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
		var bowerFile = self.bowerFiles[module]
		var mainFiles = bowerFile.main
		if (typeof mainFiles === 'string') {
			mainFiles = [mainFiles]
		}
		mainFiles.forEach(function (filepath) {
			if (self.options.excluded.indexOf(bowerFile.name) === -1) {
				self.push(new gutil.File({
					path: 'bower_components/' + bowerFile.name + '/' + filepath,
					contents: fs.readFileSync('bower_components/' + bowerFile.name + '/' + filepath)
				}))
			}
		})
	})
}

module.exports = exports = function (options) {
	return new BowerStream(options)
}