var through = require('through2'),
    es = require('event-stream');

module.exports = pipeChainPlugin;

function pipeChainPlugin () {
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