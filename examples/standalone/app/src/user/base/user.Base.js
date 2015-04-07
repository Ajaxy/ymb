ym.modules.define('user.Base', ['util.defineClass', 'config'], function (provide, defineClass, config) {
    function BaseUser (name, location) {
        this._name = name;
        this._location = location || config.location.default;
    }

    defineClass(BaseUser, {
        getName: function () {
            return this._name;
        },

        getLocation: function () {
            return config.location[this._location];
        }
    });

    provide(BaseUser);
});