module.exports = {
    js: {
        closure: require('./js/closure')
    },

    css: {
        images: require('./css/images'),
        optimize: require('gulp-csso'),
        toModules: require('./css/toModules')
    },

    templates: {
        compile: require('./templates/compile'),
        toModules: require('./templates/toModules')
    },

    modules: {
        setup: require('./modules/setup'),
        ym: require('./modules/ym'),
        plus: require('./modules/plus'),
        map: require('./modules/map'),
        async: require('./modules/async'),
        helpers: require('./modules/helpers'),
        namespace: require('./modules/namespace'),
        init: require('./modules/init'),
//        fallback: require('./modules/fallback'),
        minify: require('./modules/minify'),
        store: require('./modules/store')
    },

    util: {
        pipeChain: require('./util/pipeChain'),
        eachInStream: require('./util/eachInStream'),
        join: require('./util/join')
    },

    cache: require('gulp-cached'),
    remember: require('gulp-remember'),
    if: require('gulp-if')
};