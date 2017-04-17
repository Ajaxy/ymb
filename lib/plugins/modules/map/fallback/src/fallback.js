var promise = null;

function fallback (module, filter) {
    return promise || (promise = request(filter));
}

function request (filter) {
    filter = encodeURIComponent(filter);

    return ym.modules.require(['util.jsonp', 'util.querystring', 'util.extend', 'system.ModuleLoader'])
        .spread(function (jsonp, querystring, extend, ModuleLoader) {
            var server = ym.env.server,
                url = server.url + '/map.js',
                requestParams = {
                    filter: filter,
                    mode: server.params.mode,
                    version: server.version
                },
                paddingKey = 'ym_map_fallback';

            if (!server.params.short_jsonp_padding) {
                var cacheFactors = extend({ url: url }, requestParams),
                    cacheKey = querystring.stringify(cacheFactors, '_', '=', {
                        encodeURIComponent: function (str) { return str; }
                    });

                paddingKey += '_' + cacheKey.replace(/[:\/\.\?\&\\]/g, '_');
            }

            return jsonp({
                url: url,
                requestParams: requestParams,
                paddingKey: paddingKey
            }).then(function (map) {
                (new ModuleLoader(map, server)).defineAll();
            });
        });
}
