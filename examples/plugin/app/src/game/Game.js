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