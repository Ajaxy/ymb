var mapBuild = require('./map/build'),
    mapInitial = require('./map/initial'),
    mapFallback = require('./map/fallback'),
    pipeChain = require('../util/pipeChain');

module.exports = mapPlugin;

function mapPlugin (cfg) {
    return pipeChain([
        mapBuild(cfg),
        mapInitial(cfg),
        cfg.asyncMap && mapFallback(cfg)
    ]);
}