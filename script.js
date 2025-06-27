var board,
    game = new Chess();

var calculateBestMove =function(game) {

    var newGameMoves = game.ugly_moves();

    return newGameMoves[Math.floor(Math.random() * newGameMoves.length)];

};

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    var bestMove = getBestMove(game);
    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());
    if (game.game_over()) {
        alert('Game over');
    }
};

var getBestMove = function (game) {
    if (game.game_over()) {
        alert('Game over');
    }
    var bestMove = calculateBestMove(game);
    return bestMove;
};

var renderMoveHistory = function (moves) {
    var historyElement = $('#move-history').empty();
    historyElement.empty();
    for (var i = 0; i < moves.length; i = i + 2) {
        historyElement.append('<span>' + moves[i] + ' ' + ( moves[i + 1] ? moves[i + 1] : ' ') + '</span><br>')
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);

};

var pendingPromotion = null;

var onDrop = function (source, target) {
    var piece = game.get(source);
    var isPromotion = piece && piece.type === 'p' &&
                     ((piece.color === 'w' && target[1] === '8') ||
                      (piece.color === 'b' && target[1] === '1'));

    if (isPromotion) {
        // First, try the move to make sure it's legal
        var testMove = game.move({
            from: source,
            to: target,
            promotion: 'q'  // Test with queen
        });

        if (testMove === null) {
            removeGreySquares();
            return 'snapback';  // Illegal move
        }

        // Undo the test move
        game.undo();

        // Store the pending promotion and show dialog
        pendingPromotion = { from: source, to: target };
        document.getElementById('promotion-dialog').style.display = 'block';

        // Let the board think the move succeeded temporarily
        return;
    }

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    removeGreySquares();
    if (move === null) {
        return 'snapback';
    }

    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
};

function selectPromotion(piece) {
    document.getElementById('promotion-dialog').style.display = 'none';

    var move = game.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece
    });

    pendingPromotion = null;
    removeGreySquares();

    if (move === null) {
        // This shouldn't happen since we tested it, but just in case
        board.position(game.fen());
        return;
    }

    board.position(game.fen());
    renderMoveHistory(game.history());
    window.setTimeout(makeBestMove, 250);
}

var onSnapEnd = function () {
    board.position(game.fen());
};

var onMouseoverSquare = function(square, piece) {
    var moves = game.moves({
        square: square,
        verbose: true
    });

    if (moves.length === 0) return;

    greySquare(square);

    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
};

var removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function(square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);
