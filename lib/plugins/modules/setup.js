var file = require('gulp-file');

module.exports = setupPlugin;


/**
 * Injects main JS object `ym` with base project params as a part of `init.js`.
 * @alias "modules.setup"
 * @param {String} cfg Config.
 * @returns {stream.Transform} Stream.
 */
function setupPlugin (cfg) {
    var ym = {};

    ym.project = {
        preload: cfg.preload,
        namespace: cfg.namespace,
        jsonpPrefix: cfg.jsonpPrefix || '',
        loadLimit: 500
    };

    ym.env = {};

    return file('init#setup', 'var ym = ' + JSON.stringify(ym, '\t') + ';');
}