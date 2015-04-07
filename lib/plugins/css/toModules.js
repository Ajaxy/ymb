var path = require('path'),
    eachInStream = require('../util/eachInStream');

module.exports = toModulesPlugin;

var PLUGIN_NAME = 'ym-css-to-modules';

function toModulesPlugin () {
    return eachInStream(function (file, encoding, cb) {
        var moduleName = path.basename(file.history[0]);

        file.contents = Buffer.concat([
            new Buffer('ym.modules.define(\'' + moduleName + '\', [\'system.provideCss\'], function (provide, provideCss) {\nprovideCss("'),
            file.contents,
            new Buffer('", provide);\n});')
        ]);

        cb(null, file);
    }, PLUGIN_NAME);
}