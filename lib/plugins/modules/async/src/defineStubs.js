ym.modules.require(['system.ModuleLoader'], function (ModuleLoader) {
    (new ModuleLoader(ym.project.initialMap, ym.env.server)).defineAll();
});