// common.js - shared functions for both bot and human modes

function getPieceImageSrc(piece) {
    if (!piece) return null;
    const color = piece.color === 'w' ? 'white' : 'black';
    let type = '';
    switch (piece.type) {
        case 'k': type = 'king'; break;
        case 'q': type = 'queen'; break;
        case 'r': type = 'rook'; break;
        case 'b': type = 'bishop'; break;
        case 'n': type = 'knight'; break;
        case 'p': type = 'pawn'; break;
    }
    return `${color}${type}.png`;
}

function drawBoard(game, boardDiv, clickHandler) {
    boardDiv.innerHTML = '';
    const board = game.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            square.className = `square ${(i + j) % 2 === 0 ? 'light' : 'dark'}`;
            const piece = board[i][j];
            if (piece) {
                const img = document.createElement('img');
                img.src = getPieceImageSrc(piece);
                img.alt = `${piece.color} ${piece.type}`;
                img.className = 'piece-img';
                img.onerror = () => {
                    const fallback = document.createTextNode(piece.color === 'w' ? '♙' : '♟');
                    square.appendChild(fallback);
                };
                square.appendChild(img);
            }
            square.dataset.row = i;
            square.dataset.col = j;
            square.addEventListener('click', () => clickHandler(i, j));
            boardDiv.appendChild(square);
        }
    }
}

function highlightSquares(boardDiv, squares) {
    document.querySelectorAll('.square').forEach(sq => sq.classList.remove('highlight'));
    for (let [r,c] of squares) {
        let idx = r*8 + c;
        if (boardDiv.children[idx]) boardDiv.children[idx].classList.add('highlight');
    }
}

function clearSelected(boardDiv) {
    document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
}
