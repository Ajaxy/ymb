var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    wrapper = require('gulp-wrapper'),
    ymHelpers = require('ym-helpers'),
    join = require('../util/join');

module.exports = asyncPlugin;

var YM_HELPERS_SRC_DIR = ymHelpers.getSrcDir();

/**
 * Adds support for asynchronous loading of modules.
 * Requires files needed for current target, joins and wraps them into a function,
 * that will be called with needed params in a code added by `yms` server.
 * @alias "modules.async"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function asyncPlugin (cfg) {
    return join(
        gulp.src(cfg.target == 'standalone' ? [
//            TODO Sync modules.
                path.resolve(YM_HELPERS_SRC_DIR, 'util/nextTick/*.js'),
                path.resolve(YM_HELPERS_SRC_DIR, 'util/extend/*.js'),
                path.resolve(YM_HELPERS_SRC_DIR, 'util/objectKeys/*.js'),
                path.resolve(YM_HELPERS_SRC_DIR, 'system/mergeImports/*.js'),
                path.resolve(__dirname, 'async/src/**/*')
            ] : path.resolve(__dirname, 'async/src/*.js'))
            .pipe(concat('init#async'))
            .pipe(wrapper({
                header: [
                    '\nfunction setupAsync (env) {',
                    '    ym.env = env;',
                    '    for (var i = 0, l = ym.envCallbacks.length; i < l; i++) { ym.envCallbacks[i](env); }\n'
                ].join('\n'),
                footer: '\n}\n'
            }))
    );
}