var eachInStream = require('./../util/eachInStream');

module.exports = extractFromContextPlugin;

function extractFromContextPlugin (property, exportTo) {
    exportTo || (exportTo = 'ym');

    return eachInStream(function (file, _, cb) {
        var backupVar = '_backup_' + property,
            contextPropertyVar = 'this[\'' + property + '\']',
            exportPropertyVar = exportTo + '[\'' + property + '\']';

        file.contents = Buffer.concat([
            new Buffer('var ' + backupVar + ' = ' + contextPropertyVar + ';\n'),
            file.contents,
            new Buffer('\n' + exportPropertyVar + ' = ' + contextPropertyVar + ';\n'),
            new Buffer(contextPropertyVar + ' = ' + backupVar + ';\n'),
            new Buffer(backupVar + ' = undefined;')
        ]);

        cb(null, file);
    });
}