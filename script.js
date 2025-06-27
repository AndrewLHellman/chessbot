var board,
    game = new Chess();

var worker = new Worker('chess-worker.js');
var isCalculating = false;

var onDragStart = function (source, piece, position, orientation) {
    if (game.in_checkmate() === true || game.in_draw() === true ||
        piece.search(/^b/) !== -1) {
        return false;
    }
};

var makeBestMove = function () {
    getBestMove(game)
};

var getBestMove = function (game) {
    if (game.game_over()) {
        reportGameEnd();
        return;
    }

    if (isCalculating) return;

    isCalculating = true;
    $('#position-count').text('Calculating...');

    var depth = parseInt($('#search-depth').find(':selected').text());

    worker.postMessage({
        fen: game.fen(),
        depth: depth
    });
};

worker.onmessage = function(e) {
    var { bestMove, positionCount, moveTime, positionsPerS } = e.data;

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
    $('#positions-per-s').text(positionsPerS);

    game.ugly_move(bestMove);
    board.position(game.fen());
    renderMoveHistory(game.history());

    isCalculating = false;

    if (game.game_over()) {
        reportGameEnd();
    }
}

var reportGameEnd = function() {
    var result = '';

    if (game.in_checkmate()) {
        if (game.turn() === 'w') {
            result = 'Checkmate! Black (AI) wins!';
        } else {
            result = 'Checkmate! White (Human) wins!';
        }
    } else if (game.in_stalemate()) {
        result = 'Game ends in stalemate - Draw!';
    } else if (game.in_threefold_repetition()) {
        result = 'Game ends by threefold repetition - Draw!';
    } else if (game.insufficient_material()) {
        result = 'Game ends due to insufficient material - Draw!';
    } else if (game.in_draw()) {
        result = 'Game ends in a draw!';
    } else {
        result = 'Game over!';
    }

    alert(result);
    console.log(result);
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
        var testMove = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (testMove === null) {
            removeGreySquares();
            return 'snapback';
        }

        game.undo();

        pendingPromotion = { from: source, to: target };
        document.getElementById('promotion-dialog').style.display = 'block';

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
