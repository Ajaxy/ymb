var path = require('path'),
    gulp = require('gulp'),
    cache = require('gulp-cached'),
    ymHelpers = require('ym-helpers'),
    join = require('../util/join');

module.exports = helpersPlugin;

/**
 * Injects modules from `ym-helpers` package.
 * @alias "modules.helpers"
 * @see https://www.npmjs.com/package/ym-helpers
 * @returns {stream.Transform} Stream
 */
function helpersPlugin (ctx) {
    return join(
        gulp.src(path.resolve(ymHelpers.getSrcDir(), '**/*.js'))
            .pipe(cache(ctx.name || 'ymb#helpers'))
    );
}
