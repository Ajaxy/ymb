var path = require('path'),
    gulp = require('gulp'),
    order = require('gulp-order'),
    concat = require('gulp-concat'),
    footer = require('gulp-footer'),
    es = require('event-stream'),
    extractFromContext = require('../js/extractFromContext'),
    join = require('../util/join');

module.exports = plusPlugin;

/**
 * Injects `vow` and `Modules Plus` code.
 * `Modules Plus` is an additional layer to modular system `ym` that introduces:
 * — promises support
 * — dynamic dependencies and "predictor"
 * — modules `Definition` interface
 * — asynchronous storages
 * — providing of packages
 * — "map fallbacks" support
 * — synchronous `define` and `require`
 * — etc.
 * @alias "modules.plus"
 * @see https://www.npmjs.com/package/vow
 * @see https://www.npmjs.com/package/ym
 * @returns {stream.Transform} Stream
 */
function plusPlugin () {
    var vowStream = gulp.src(path.resolve(__dirname, '../../../node_modules/vow/lib/vow.js'))
            .pipe(extractFromContext('vow')),

        plusStream = gulp.src(path.resolve(__dirname, 'plus/src/modulesPlus.js'))
            .pipe(extractFromContext('modules'))
            .pipe(footer('\nym.ns.modules = ym.modules;'));

    return join(
        es.merge(vowStream, plusStream)
            .pipe(order(['**/vow.js', '**/modulesPlus.js']))
            .pipe(concat('init#plus'))
    );
}