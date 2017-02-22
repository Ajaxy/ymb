var path = require('path'),
    _ = require('lodash'),
    vow = require('vow'),
    fs = require('vow-fs'),
    md5 = require('md5-jkmyers'),
    eachInStream = require('../util/eachInStream');

module.exports = cssImagesPlugin;

var PLUGIN_NAME = 'ym-css-images',
    DEST_DIR = 'images/',
    NO_DATA_URI_MARK = '#no-datauri';

var infoByPath = {},
    currentCfg = null;

/**
 * Makes a search for references to images in CSS files, reads images files,
 * moves them into images build folder and replaces its references with Data URI representation (if needed).
 * @alias "css.images"
 * @param {Object} cfg Config
 * @returns {stream.Transform} Stream
 */
function cssImagesPlugin (cfg) {
    currentCfg = cfg;

    return eachInStream(function (file, encoding, cb) {
        var content = file.contents.toString(),
            matchRegExp = /[\w\-\/\.]+\.(svg|gif|png|jpg|jpeg|cur)/igm,
            replaceRegExp = /[\w\-\/\.]+\.(svg|gif|png|jpg|jpeg|cur)(#[\w\-]+)?/igm,
            srcImages = content.match(matchRegExp);

        if (!srcImages) {
            cb(null, file);
            return;
        }

        var modulePath = path.dirname(file.path),
            destPath = path.resolve(process.cwd(), currentCfg.dest, currentCfg.publicDir, DEST_DIR);

        fs.makeDir(destPath).then(function () {
            return processImages(modulePath, srcImages, destPath);
        }).then(function () {
            file.contents = new Buffer(content.replace(replaceRegExp, function (fileName) {
                var info = infoByPath[path.join(modulePath, fileName.split('#')[0])];

                return !currentCfg.dataUriImages || _.endsWith(fileName, NO_DATA_URI_MARK) ?
                    (DEST_DIR + info.md5filename) :
                    info.dataUri;
            }));

            cb(null, file);
        }).fail(function (err) {
            console.log('[warn] Image processing error from file ' + file.path);
            console.error(err);
            cb(null, file)
        }).done();
    }, PLUGIN_NAME);
}

function processImages (modulePath, srcImages, destPath) {
    var processPromises = [];

    _.each(srcImages, function (imagePath) {
        imagePath = path.join(modulePath, imagePath);

        if (!infoByPath[imagePath]) {
            processPromises.push(
                fs.read(imagePath).then(function (content) {
                    var base64 = content.toString('base64'),
                        md5hash = md5(base64),
                        md5filename = md5hash + path.extname(imagePath);

                    infoByPath[imagePath] = {
                        md5filename: md5filename,
                        dataUri: content.toString('utf8').match(/\w*\<svg/) ?
                        'data:image/svg+xml;base64,' + base64 :
                        'data:image/' + getMimeType(imagePath) + ';base64,' + base64
                    };

                    return fs.copy(imagePath, path.resolve(destPath, md5filename));
                })
            );
        }
    });

    return vow.all(processPromises);
}

function getMimeType (fileName) {
    var FORMATS = { cur: 'x-icon' };

    var ext = path.extname(fileName).substr(1);

    return FORMATS[ext] || ext;
}