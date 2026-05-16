// common.js – board drawing and highlight functions

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
    if (!boardDiv) return;
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
                    // fallback to Unicode symbol
                    square.innerHTML = '';
                    const symbol = piece.color === 'w' ? '♙' : '♟';
                    square.appendChild(document.createTextNode(symbol));
                    square.style.fontSize = 'clamp(28px, 6vw, 48px)';
                    square.style.display = 'flex';
                    square.style.alignItems = 'center';
                    square.style.justifyContent = 'center';
                };
                square.appendChild(img);
            }
            square.dataset.row = i;
            square.dataset.col = j;
            // Attach click handler using closure
            square.addEventListener('click', (function(r, c) {
                return function() { clickHandler(r, c); };
            })(i, j));
            boardDiv.appendChild(square);
        }
    }
}

function highlightSquares(boardDiv, squares) {
    // remove existing
    for (let i = 0; i < boardDiv.children.length; i++) {
        boardDiv.children[i].classList.remove('has-legal-move');
    }
    // add new
    for (let [r, c] of squares) {
        const idx = r * 8 + c;
        if (boardDiv.children[idx]) {
            boardDiv.children[idx].classList.add('has-legal-move');
        }
    }
}

function clearSelected(boardDiv) {
    for (let i = 0; i < boardDiv.children.length; i++) {
        boardDiv.children[i].classList.remove('selected');
    }
}
