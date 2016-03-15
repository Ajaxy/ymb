var path = require('path'),
    gulp = require('gulp'),
    footer = require('gulp-footer'),
    concat = require('gulp-concat'),
    join = require('../../util/join'),
    closure = require('../../js/closure');

module.exports = mapFallbackPlugin;

/**
 * @ignore
 * Adds "modules map fallback" for specified filter.
 * Map fallbacks allow asynchronous lazy loading information about modules (parts of map.js file)
 * by a module name filter.
 * @alias "modules.mapFallback"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function mapFallbackPlugin (cfg) {
    return join(
        gulp.src([
//            TODO Sync modules.
            path.resolve(__dirname, '../../../../node_modules/ym-helpers/src/modules/util/id/*.js'),
            path.resolve(__dirname, '../../../../node_modules/ym-helpers/src/modules/util/querystring/*.js'),
            path.resolve(__dirname, '../../../../node_modules/ym-helpers/src/modules/util/script/*.js'),
            path.resolve(__dirname, '../../../../node_modules/ym-helpers/src/modules/util/jsonp/*.js'),

            path.resolve(__dirname, 'fallback/src/fallback.js')
        ])
            .pipe(concat('init#fallback'))
            .pipe(footer('\nym.modules.fallbacks.register(' + buildFilter(cfg) + ', fallback);'))
            .pipe(closure())
    );
}

function buildFilter (cfg) {
    if (cfg.target == 'standalone') {
        return "'*'";
    }

    if (cfg.fallbackFilter) {
        return cfg.fallbackFilter;
    }

    return '/^' + cfg.namespace.replace('.', '\.') + '\./';
}