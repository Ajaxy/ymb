var through = require('through2'),
    es = require('event-stream');

module.exports = pipeChain;

/**
 * Allows to create a chain of plugins where streams will be piped from one plugin to another.
 * Later this chain can be injected anywhere in a pipeline,
 * so pipeline contents will get inside the first plugin and the go out from the last one.
 * @alias "util.pipeChain"
 * @returns {stream.Transform} Stream
 */
function pipeChain () {
    var inputStream = through.obj();

    if (!arguments.length) {
        return inputStream;
    }

    var plugins = 'length' in arguments[0] ? arguments[0] : arguments,
        outputStream = inputStream;

    for (var i = 0, l = plugins.length; i < l; i++) {
        if (!plugins[i]) {
            continue;
        }

        outputStream = outputStream.pipe(plugins[i]);
    }

    return es.duplex(inputStream, outputStream);
}