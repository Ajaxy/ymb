var fallback = {
        retrieve: function (module) {
            var deferred = ym.vow.defer();

            ym.modules.require(['util.jsonp', 'system.ModuleLoader'], function (jsonp, ModuleLoader) {
                jsonp({
                    url: ym.env.server.url + '/map.js',
                    requestParams: {
                        modules: module,
                        mode: ym.env.server.params.mode
                    },
                    noCache: true
                }).done(function (map) {
                    (new ModuleLoader(map, ym.env.server)).defineAll();

                    deferred.resolve();
                });
            });

            return deferred.promise();
        }
    };