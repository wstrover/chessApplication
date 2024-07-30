// boardLogic.ts
import { Piece, PieceColor } from './Piece';
import { Pawn } from './Pawn';
import { Rook } from './Rook';
import { Knight } from './Knight';
import { Bishop } from './Bishop';
import { Queen } from './Queen';
import { King } from './King';

export const initialBoardSetup = (): (Piece | null)[][] => {
    const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place Pawns
    for (let i = 0; i < 8; i++) {
        board[1][i] = new Pawn(PieceColor.Black);
        board[6][i] = new Pawn(PieceColor.White);
    }

    // Place Rooks
    board[0][0] = new Rook(PieceColor.Black);
    board[0][7] = new Rook(PieceColor.Black);
    board[7][0] = new Rook(PieceColor.White);
    board[7][7] = new Rook(PieceColor.White);

    // Place Knights
    board[0][1] = new Knight(PieceColor.Black);
    board[0][6] = new Knight(PieceColor.Black);
    board[7][1] = new Knight(PieceColor.White);
    board[7][6] = new Knight(PieceColor.White);

    // Place Bishops
    board[0][2] = new Bishop(PieceColor.Black);
    board[0][5] = new Bishop(PieceColor.Black);
    board[7][2] = new Bishop(PieceColor.White);
    board[7][5] = new Bishop(PieceColor.White);

    // Place Queens
    board[0][3] = new Queen(PieceColor.Black);
    board[7][3] = new Queen(PieceColor.White);

    // Place Kings
    board[0][4] = new King(PieceColor.Black);
    board[7][4] = new King(PieceColor.White);

    return board;
};
