var gulpIf = require('gulp-if'),
    uglify = require('gulp-uglify'),
    clc = require('cli-color');
    moment = require('moment');

module.exports = minifyPlugin;

/**
 * Runs `uglify()`.
 * @alias "modules.minify"
 * @returns {stream.Transform} Stream
 */
function minifyPlugin(cfg) {
    var options = typeof cfg.minify == 'object' ? cfg.minify : {},
        loggedFirst = false;

    return gulpIf(function (file) {
        var condition = file.relative.match(new RegExp('.' + (options.extension || 'js') + '$'));

        if (condition && !loggedFirst) {
            console.log(
                '[' + clc.blackBright(moment().format('HH:mm:ss')) +
                '] Running ' + clc.cyan('uglify-js') + '...'
            );
            loggedFirst = true;
        }

        return condition;
    }, uglify(options));
}
