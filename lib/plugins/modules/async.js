var path = require('path'),
    gulp = require('gulp'),
    file = require('gulp-file'),
    addSrc = require('gulp-add-src'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    wrapper = require('gulp-wrapper'),
    join = require('../util/join');

module.exports = asyncPlugin;

function asyncPlugin (cfg) {
    return join(
        gulp.src(path.resolve(__dirname, cfg.target == 'standalone' ? 'async/src/**/*' : 'async/src/defineStubs.js'))
            .pipe(concat('init#async'))
            .pipe(wrapper({
                header: 'function setupAsync (env) {\nym.env = env;\n\n',
                footer: '\n\n}'
            }))
    );
}