var mapBuild = require('./map/build'),
    mapInitial = require('./map/initial'),
    mapFallback = require('./map/fallback'),
    pipeChain = require('../util/pipeChain');

module.exports = mapPlugin;

/**
 * Collects information about modules in the src path.
 * Check out child plugins for more info.
 * @param {String} cfg Config.
 * @returns {stream.Transform} Stream.
 */
function mapPlugin (cfg) {
    return pipeChain([
        mapBuild(cfg),
        mapInitial(cfg),
        cfg.asyncMap && mapFallback(cfg)
    ]);
}