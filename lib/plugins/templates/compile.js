var vowNode = require('vow-node'),
    ymHelpers = require('ym-helpers'),
    eachInStream = require('../util/eachInStream');

module.exports = compilePlugin;

var PLUGIN_NAME = 'ym-templates-compile';

var parserPromise = vowNode.promisify(ymHelpers.require)(['template.Parser']).then(function (TemplateParser) {
    return new TemplateParser();
});

function compilePlugin () {
    return eachInStream(function (file, encoding, cb) {
        parserPromise.then(function (templateParser) {
            var tree = templateParser.parse(file.contents.toString()),
                str = JSON.stringify(tree);

            file.contents = new Buffer(str);

            cb(null, file);
        }).done();
    }, PLUGIN_NAME);
}