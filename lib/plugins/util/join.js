var through = require('through2'),
    es = require('event-stream');

module.exports = join;

function join (joinStream) {
    var inputStream = through.obj();

    return es.duplex(inputStream, es.merge(joinStream, inputStream));
}