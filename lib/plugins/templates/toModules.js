var path = require('path'),
    fs = require('vow-fs'),
    eachInStream = require('../util/eachInStream');

module.exports = toModulesPlugin;

var PLUGIN_NAME = 'ym-templates-to-modules';

/**
 * Wraps HTML code into an `ym` module.
 * @alias "templates.toModules"
 * @returns {stream.Transform} Stream.
 */
function toModulesPlugin () {
    return eachInStream(function (file, encoding, cb) {
        checkFromModuleJson(file)
            .then(function (json) {
                var moduleName = json && json.name || path.basename(file.history[0]),
                    deps = parseDeps(json && json.depends);

                file.contents = Buffer.concat([
                    new Buffer('ym.modules.define(\'' + moduleName + '\', ' + deps + ', function (provide) {\nprovide('),
                    file.contents,
                    new Buffer(');\n});')
                ]);

                cb(null, file);
            }).done();
    }, PLUGIN_NAME);
}

function checkFromModuleJson (file) {
    var filename = path.dirname(file.path) + '/module.json';

    return fs.read(filename)
        .then(function (contents) {
            try {
                return JSON.parse(contents);
            } catch (e) {
                console.error('JSON parsing of ' + filename + 'failed: ', e);
            }
        })
        .fail(function () { return null; });
}

function parseDeps (deps) {
    // TODO func depends

    return JSON.stringify(deps || []);
}