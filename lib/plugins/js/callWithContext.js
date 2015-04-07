var eachInStream = require('./../util/eachInStream');

module.exports = callWithContextPlugin;

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