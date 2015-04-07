var path = require('path'),
    gulp = require('gulp'),
    footer = require('gulp-footer'),
    concat = require('gulp-concat'),
    join = require('../../util/join'),
    closure = require('../../js/closure');

module.exports = mapAsyncPlugin;

function mapAsyncPlugin (cfg) {
    return join(
        gulp.src([
//            TODO Sync modules.
            path.resolve('../../../../node_modules/ym-helpers/src/modules/util/id/*.js'),
            path.resolve('../../../../node_modules/ym-helpers/src/modules/util/script/*.js'),
            path.resolve('../../../../node_modules/ym-helpers/src/modules/util/jsonp/*.js'),

            path.resolve(__dirname, 'fallback/src/fallback.js')
        ])
            .pipe(concat('init#fallback'))
            .pipe(footer('\nym.modules.fallbacks.register(' + buildFilter(cfg) + ', fallback);'))
            .pipe(closure())
    );
}

function buildFilter (cfg) {
    if (cfg.target == 'standalone') {
        return null;
    }

    if (cfg.fallbackFilter) {
        return cfg.fallbackFilter;
    }

    return '/^' + cfg.namespace.replace('.', '\.') + '\./';
}