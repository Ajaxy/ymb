var gulpIf = require('gulp-if'),
    uglify = require('gulp-uglify');

module.exports = minifyPlugin;

function minifyPlugin () {
    return gulpIf(function (file) {
        return file.relative.match(/.js$/);
    }, uglify());
}