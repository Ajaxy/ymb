var path = require('path'),
    gulp = require('gulp'),
    order = require('gulp-order'),
    concat = require('gulp-concat'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    rename = require('gulp-rename'),
    es = require('event-stream'),
    extractFromCommonJs = require('../js/extractFromCommonJs'),
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
            .pipe(header('var define, modules;'))
            .pipe(extractFromCommonJs('vow')),

        defineVowStream = gulp.src(path.resolve(__dirname, 'plus/src/modules/vow.js'))
            .pipe(footer('\nym.ns.vow = ym.vow;'))
            .pipe(rename('defineVow.js')),

        plusStream = gulp.src(path.resolve(__dirname, 'plus/src/modulesPlus.js'))
            .pipe(extractFromContext('modules'))
            .pipe(footer('\nym.ns.modules = ym.modules;'));

    return join(
        es.merge(vowStream, defineVowStream, plusStream)
            .pipe(order(['vow.js', 'defineVow.js', 'modulesPlus.js']))
            .pipe(concat('init#plus'))
    );
}