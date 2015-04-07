var path = require('path'),
    eachInStream = require('../util/eachInStream');

module.exports = toModulesPlugin;

var PLUGIN_NAME = 'ym-templates-to-modules';

function toModulesPlugin () {
    return eachInStream(function (file, encoding, cb) {
        var moduleName = path.basename(file.history[0]);

        file.contents = Buffer.concat([
            new Buffer('ym.modules.define(\'' + moduleName + '\', function (provide) {\nprovide('),
            file.contents,
            new Buffer(');\n});')
        ]);

        cb(null, file);
    }, PLUGIN_NAME);
}