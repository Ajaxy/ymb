var path = require('path'),
    gulp = require('gulp'),
    header = require('gulp-header'),
    rename = require('gulp-rename'),
    join = require('../util/join');

module.exports = namespacePlugin;

function namespacePlugin (cfg) {
    return join(
        gulp.src(path.resolve(__dirname, 'namespace/src/namespace.js'))
            .pipe(rename('init#namespace'))
    );
}