ym.modules.define('Game', ['util.defineClass', 'user.Player'], function (provide, defineClass, Player) {
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

            this._setupView();
        },

        _setupView: function () {
            document.body.innerHTML += 'Players in game: ' + this._getPlayerNames();
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