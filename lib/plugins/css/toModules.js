var path = require('path'),
    fs = require('vow-fs'),
    eachInStream = require('../util/eachInStream');

module.exports = toModulesPlugin;

var PLUGIN_NAME = 'ym-css-to-modules';

function toModulesPlugin () {
    return eachInStream(function (file, encoding, cb) {
        checkFromModuleJson(file)
            .then(function (json) {
                var moduleName = json && json.name || path.basename(file.history[0]);

                file.contents = Buffer.concat([
                    new Buffer('ym.modules.define(\'' + moduleName + '\', [\'system.provideCss\'], function (provide, provideCss) {\nprovideCss("'),
                    escapeQuotes(file.contents),
                    new Buffer('", provide);\n});')
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
            return contents;
        })
        .fail(function () { return null; });
}

function escapeQuotes (buffer) {
    return new Buffer(buffer.toString().replace(/"/g, '\\"'));
}