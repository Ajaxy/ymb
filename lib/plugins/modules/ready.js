var path = require('path'),
    gulp = require('gulp'),
    rename = require('gulp-rename'),
    join = require('../util/join');

module.exports = readyPlugin;

function readyPlugin () {
    return join(
        gulp.src(path.resolve(__dirname, 'ready/src/ready.js'))
            .pipe(rename('init#ready'))
    );
}