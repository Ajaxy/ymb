var gulpIf = require('gulp-if'),
    uglify = require('gulp-uglify');

module.exports = minifyPlugin;

/**
 * Runs `uglify()` on JS files.
 * @returns {stream.Transform} Stream.
 */
function minifyPlugin () {
    return gulpIf(function (file) {
        return file.relative.match(/.js$/);
    }, uglify());
}