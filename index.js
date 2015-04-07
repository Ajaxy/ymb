module.exports = {
    gulp: require('gulp'),
    es: require('event-stream'),
    del: require('del'),
    plugins: require('./lib/plugins/public'),
    resolveBuildConfig: require('./lib/resolveBuildConfig')
};