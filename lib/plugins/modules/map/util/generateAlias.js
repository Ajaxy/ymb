module.exports = generateAlias;

var ALPHABET_1 = '0123456789$-_.!*(),qjzQJZ',
    ALPHABET_2 = 'abcdefghiklmnoprstuvwxyABCDEFGHIKLMNOPRSTUVWXY' + ALPHABET_1,
    SIZE_1 = ALPHABET_1.length,
    SIZE_2 = ALPHABET_2.length,
    MAX_SIZE = SIZE_1 * SIZE_2;

var currentIndex = 0;

function generateAlias () {
    if (currentIndex + 1 >= MAX_SIZE) {
        throw new Error('Possible aliases combinations amount exceeded.');
    }

    var symbolIndex1 = Math.floor(currentIndex / SIZE_2),
        symbolIndex2 = currentIndex % SIZE_2;

    currentIndex++;

    return ALPHABET_1[symbolIndex1] + ALPHABET_2[symbolIndex2];
}