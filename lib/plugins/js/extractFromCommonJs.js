var eachInStream = require('./../util/eachInStream');

module.exports = extractFromCommonJsPlugin;

/**
 * @ignore
 * Allows to extract the value of some module that is being set in CommonJS style.
 * @alias "js.extractFromCommonJs"
 * @param {String} moduleName Module name
 * @param {String} exportTo Name of the JS object that the module will be exported into
 * @returns {stream.Transform} Stream
 */
function extractFromCommonJsPlugin (moduleName, exportTo) {
    exportTo || (exportTo = 'ym');

    var COMMON_JS_ENV = 'var module = { exports: {} }, exports = module.exports;';

    return eachInStream(function (file, _, cb) {
        var exportModuleVar = exportTo + '[\'' + moduleName + '\']',
            commonJsModuleVar = 'module.exports';

        file.contents = Buffer.concat([
            new Buffer('(function () {\n'),
            new Buffer(COMMON_JS_ENV + '\n'),
            file.contents,
            new Buffer('\n' + exportModuleVar + ' = ' + commonJsModuleVar + ';\n'),
            new Buffer('})();\n')
        ]);

        cb(null, file);
    });
}