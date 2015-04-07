(function (global){


var ym = {"project":{"namespace":"ymaps","jsonpPrefix":"","loadLimit":500},"env":{}};

ym.modules = global['ymaps'].modules;

ym.modules.define('config', function (provide) {
    provide({
        location: {
            default: 'ru',
            ru: 'Russia',
            us: 'USA',
            uk: 'United Kingdom'
        }
    });
});
ym.modules.define('Game', [
    'util.defineClass', 'user.Player', 'game.Layout'
], function (provide, defineClass, Player, GameLayout) {
    function Game () {
        this._players = [];
    }

    defineClass(Game, {
        addPlayer: function (name, from) {
            this._players.push(new Player(name, from));
        },

        start: function () {
            for (var i = 0, l = this._players.length; i < l; i++) {
                this._players[i].play();
            }

            this._setupLayout();
        },

        _setupLayout: function () {
            var layout = new GameLayout({ playerNames: this._getPlayerNames() });

            layout.setParentElement(document.body);
        },

        _getPlayerNames: function () {
            var names = [];

            for (var i = 0, l = this._players.length; i < l; i++) {
                names.push(this._players[i].getName());
            }

            return names.join(', ');
        }
    });

    provide(Game);
});
ym.modules.define('game.layout.css', ['system.provideCss'], function (provide, provideCss) {
provideCss(".ym-game{background:#b8a0ff;display:inline-block;color:#fff;font-family:Arial,serif;font-size:14px;padding:20px}", provide);
});
ym.modules.define('game.Layout', [
    'templateLayoutFactory',
    'game.layout.ymtpl',
    'game.layout.css'
], function (provide, templateLayoutFactory, template) {
    var GameLayout = templateLayoutFactory.createClass(template);

    provide(GameLayout);
});
ym.modules.define('game.layout.ymtpl', function (provide) {
provide([0,"<div class=\"ym-game\">Players in game: ",2001,["playerNames",[]],0,".</div>"]);
});
ym.modules.define('package.game', ['util.providePackage', 'Game'], function (provide, providePackage) {
    providePackage(this, arguments);
});
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
ym.modules.define('user.Player', ['util.defineClass', 'user.Base'], function (provide, defineClass, BaseUser) {
    function Player () {
        Player.superclass.constructor.apply(this, arguments);
    }

    defineClass(Player, BaseUser, {
        play: function () {
            console.log(this.getName() + ' from ' + this.getLocation() + ' started playing.');
        }
    });

    provide(Player);
});
ym.modules.define('util.providePackage', ['system.mergeImports'], function (provide, mergeImports) {
    provide(function (srcPackage, packageArgs) {
        var packageProvide = packageArgs[0],
            packageModules = Array.prototype.slice.call(packageArgs, 1),
            ns = mergeImports.joinImports(srcPackage.name, {}, srcPackage.deps, packageModules);

        packageProvide(ns);
    });
});

})(this);