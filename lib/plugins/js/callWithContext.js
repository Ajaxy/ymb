var eachInStream = require('./../util/eachInStream');

module.exports = callWithContextPlugin;

/**
 * @ignore
 * Wraps code into JS function that is immediately called with some context.
 * @alias "js.callWithContext"
 * @param {String} context Name of the JS variable to be used as context
 * @returns {stream.Transform} Stream
 */
function callWithContextPlugin (context) {
    return eachInStream(function (file, _, cb) {
        file.contents = Buffer.concat([
            new Buffer('(function () {\n'),
            file.contents,
            new Buffer('\n}).call(' + context + ');')
        ]);

        cb(null, file);
    });
}