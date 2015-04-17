var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    wrapper = require('gulp-wrapper'),
    join = require('../util/join');

module.exports = asyncPlugin;

function asyncPlugin (cfg) {
    return join(
        gulp.src(cfg.target == 'standalone' ? [
//            TODO Sync modules.
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/nextTick/*.js'),
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/extend/*.js'),
                path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/util/objectKeys/*.js'),
                path.resolve(__dirname, 'async/src/**/*')
            ] : path.resolve(__dirname, 'async/src/defineStubs.js'))
            .pipe(concat('init#async'))
            .pipe(wrapper({
                header: 'function setupAsync (env) {\nym.env = env;\n\n',
                footer: '\n\n}'
            }))
    );
}