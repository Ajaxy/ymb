var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    wrapper = require('gulp-wrapper'),
    join = require('../util/join');

module.exports = asyncPlugin;

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
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/nextTick/*.js'),
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/extend/*.js'),
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/objectKeys/*.js'),
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/system/mergeImports/*.js'),
                path.resolve(__dirname, 'async/src/**/*')
            ] : path.resolve(__dirname, 'async/src/defineStubs.js'))
            .pipe(concat('init#async'))
            .pipe(wrapper({
                header: [
                    '\nfunction setupAsync (env) {',
                    '    ym.env = env;',
                    '    setupNamespace();\n'
                ].join('\n'),
                footer: '\n}\n'
            }))
    );
}