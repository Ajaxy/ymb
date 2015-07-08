var through = require('through2'),
    PluginError = require('gulp-util').PluginError;

module.exports = eachInStream;

/**
 * Helper for running handlers only for non empty buffers in the stream.
 * @alias "util.eachInStream"
 * @returns {stream.Transform} Stream.
 */
function eachInStream (bufferHandler, endHandler, pluginName) {
    if (typeof pluginName != 'string') {
        pluginName = typeof endHandler == 'string' ? endHandler : 'ym-plugin';
    }
    endHandler = typeof endHandler == 'function' ? endHandler : undefined;

    return through.obj(function (file, encoding, cb) {
        if (file.isNull()) {
            cb(null, file);

        } else if (file.isStream()) {
            cb(new PluginError(pluginName, 'Streaming not supported', {
                fileName: file.path,
                showStack: false
            }));

        } else if (file.isBuffer()) {
            bufferHandler.call(this, file, encoding, cb);
        }
    }, endHandler);
}