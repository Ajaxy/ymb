var path = require('path'),
    gulp = require('gulp'),
    cache = require('gulp-cached'),
    join = require('../util/join');

module.exports = helpersPlugin;

/**
 * Injects modules from `ym-helpers` package.
 * @alias "modules.helpers"
 * @see https://www.npmjs.com/package/ym-helpers
 * @returns {stream.Transform} Stream
 */
function helpersPlugin () {
    return join(
        gulp.src(path.resolve(__dirname, '../../../node_modules/ym-helpers/src/modules/**/*.js'))
            .pipe(cache('ymb#helpers'))
    );
}