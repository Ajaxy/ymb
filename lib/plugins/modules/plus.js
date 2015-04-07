var path = require('path'),
    gulp = require('gulp'),
    order = require('gulp-order'),
    concat = require('gulp-concat'),
    es = require('event-stream'),
    extractFromContext = require('../js/extractFromContext'),
    join = require('../util/join');

module.exports = plusPlugin;

function plusPlugin () {
    var vowStream = gulp.src(path.resolve(__dirname, '../../../node_modules/vow/lib/vow.js'))
            .pipe(extractFromContext('vow')),

        plusStream = gulp.src(path.resolve(__dirname, 'plus/src/modulesPlus.js'))
            .pipe(extractFromContext('modules'));

    return join(
        es.merge(vowStream, plusStream)
            .pipe(order(['**/vow.js', '**/modulesPlus.js']))
            .pipe(concat('init#plus'))
    );
}