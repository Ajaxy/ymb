var vowNode = require('vow-node'),
    ymHelpers = require('ym-helpers'),
    eachInStream = require('../util/eachInStream');

module.exports = compilePlugin;

var PLUGIN_NAME = 'ym-templates-compile';

var parserPromise = vowNode.promisify(ymHelpers.require)(['template.Parser']).then(function (TemplateParser) {
    return new TemplateParser();
});

/**
 * Pre-compiles HTML templates using `template.Parser` module from `ym-helpers` package.
 * @alias "templates.compile"
 * @see https://www.npmjs.com/package/ym-helpers
 * @returns {stream.Transform} Stream.
 */
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