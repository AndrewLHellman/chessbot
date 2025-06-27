var board,
    game = new Chess();

var minimaxRoot = function(depth, game, isMaximisingPlayer) {
    var newGameMoves = game.ugly_moves();
    var bestMove = -Infinity;
    var bestMovesFound = [];

    for (let i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.ugly_move(newGameMove);
        var value = minimax(depth - 1, game, -Infinity, Infinity, !isMaximisingPlayer);
        game.undo();
        if (value > bestMove) {
            bestMove = value;
            bestMovesFound = [newGameMove];
        } else if (value === bestMove) {
            bestMovesFound.push(newGameMove);
        }
    }
    return bestMovesFound[Math.floor(Math.random() * bestMovesFound.length)];
}

var minimax = function (depth, game, alpha, beta, isMaximisingPlayer) {
    positionCount++;
    if (depth === 0) {
        return -evaluateBoard(game.board());
    }

    var newGameMoves = game.ugly_moves();

    if (isMaximisingPlayer) {
        var bestMove = -Infinity;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i])
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = Infinity;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.ugly_move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
}

var evaluateBoard = function (board) {
    var totalEvalutation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvalutation += getPieceValue(board[i][j]);
        }
    }
    return totalEvalutation;
}

var getPieceValue = function (piece) {
    if (piece === null) {
        return 0;
    }
    var getAbsoluteValue = function (piece) {
        if (piece.type === 'p') {
            return 10;
        } else if (piece.type === 'r') {
            return 50;
        } else if (piece.type === 'n') {
            return 30;
        } else if (piece.type === 'b') {
            return 30 ;
        } else if (piece.type === 'q') {
            return 90;
        } else if (piece.type === 'k') {
            return 900;
        }
        throw "Unknown piece type: " + piece.type;
    };

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w');
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
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
        reportGameEnd();
    }
};

var positionCount;
var getBestMove = function (game) {
    if (game.game_over()) {
        reportGameEnd();
    }

    positionCount = 0;
    var depth = parseInt($('#search-depth').find(':selected').text());

    var d = new Date().getTime();
    var bestMove = minimaxRoot(depth, game, true);
    var d2 = new Date().getTime();
    var moveTime = (d2 - d);
    var positionsPerS = ( positionCount * 1000 / moveTime);

    $('#position-count').text(positionCount);
    $('#time').text(moveTime/1000 + 's');
    $('#positions-per-s').text(positionsPerS);
    return bestMove;
};

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
