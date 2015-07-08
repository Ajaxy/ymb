var through = require('through2'),
    es = require('event-stream');

module.exports = join;

/**
 * Allows to join stream as an "incoming branch" for some other main stream.
 * @alias "util.join"
 * @returns {stream.Transform} Stream
 */
function join (joinStream) {
    var inputStream = through.obj();

    return es.duplex(inputStream, es.merge(joinStream, inputStream));
}