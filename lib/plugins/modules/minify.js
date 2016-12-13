var gulpIf = require('gulp-if'),
    uglify = require('gulp-uglify');

module.exports = minifyPlugin;

/**
 * Runs `uglify()`.
 * @alias "modules.minify"
 * @returns {stream.Transform} Stream
 */
function minifyPlugin(cfg) {
    var options = cfg.minify || {};
    return gulpIf(function (file) {
        return file.relative.match(new RegExp('.' + (options.extension || 'js') + '$'));
    }, uglify(options));
}
