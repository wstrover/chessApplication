import { notationLogic } from '../notationLogic';
import { Piece, PieceType, PieceColor } from '../Piece';
import { Pawn } from '../Pawn';
import { Rook } from '../Rook';
import { Knight } from '../Knight';
import { Bishop } from '../Bishop';
import { Queen } from '../Queen';
import { King } from '../King';

describe('notationLogic', () => {
    it('should correctly change the turn in the FEN string', () => {
        expect(notationLogic.changeTurn(['rnbqkbnr', 'w', 'KQkq', ' ', '0', '1'])).toEqual(['rnbqkbnr', 'b', 'KQkq', ' ', '0', '1']);
        expect(notationLogic.changeTurn(['rnbqkbnr', 'b', 'KQkq', ' ', '0', '1'])).toEqual(['rnbqkbnr', 'w', 'KQkq', ' ', '0', '1']);
    });

    it('should correctly generate FEN string for a board', () => {
        const board: (Piece | null)[][] = [
            [new Rook(PieceColor.Black), new Knight(PieceColor.Black), new Bishop(PieceColor.Black), new Queen(PieceColor.Black), new King(PieceColor.Black), new Bishop(PieceColor.Black), new Knight(PieceColor.Black), new Rook(PieceColor.Black)],
            [new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black)],
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            [new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White)],
            [new Rook(PieceColor.White), new Knight(PieceColor.White), new Bishop(PieceColor.White), new Queen(PieceColor.White), new King(PieceColor.White), new Bishop(PieceColor.White), new Knight(PieceColor.White), new Rook(PieceColor.White)]
        ];

        expect(notationLogic.getBoardFEN(board)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should correctly get FEN representation for a piece', () => {
        const whitePawn = new Pawn(PieceColor.White);
        const blackRook = new Rook(PieceColor.Black);

        expect(notationLogic.getPieceFEN(whitePawn)).toBe('P');
        expect(notationLogic.getPieceFEN(blackRook)).toBe('r');
    });

    

    it('should correctly change en passant target in the FEN string', () => {
        expect(notationLogic.changeEnPassantTarget(['rnbqkbnr', 'w', 'KQkq', ' ', '0', '1'], 'e3')).toEqual(['rnbqkbnr', 'w', 'KQkq', 'e3', '0', '1']);
    });

    it('should correctly convert FEN to board', () => {
        const fen = 'RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr w KQkq - 0 1';
        const expectedBoard: (Piece | null)[][] = [
            [new Rook(PieceColor.White), new Knight(PieceColor.White), new Bishop(PieceColor.White), new Queen(PieceColor.White), new King(PieceColor.White), new Bishop(PieceColor.White), new Knight(PieceColor.White), new Rook(PieceColor.White)],
            [new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White), new Pawn(PieceColor.White)],
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            [new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black), new Pawn(PieceColor.Black)],
            [new Rook(PieceColor.Black), new Knight(PieceColor.Black), new Bishop(PieceColor.Black), new Queen(PieceColor.Black), new King(PieceColor.Black), new Bishop(PieceColor.Black), new Knight(PieceColor.Black), new Rook(PieceColor.Black)]
        ];

        expect(notationLogic.fenToBoard(fen)).toEqual(expectedBoard);
    });

    it('should correctly update move clocks in the FEN string', () => {
        expect(notationLogic.changeMoveClocks(['rnbqkbnr', 'w', 'KQkq', ' ', '0', '1'], [[null]]))
            .toEqual(['rnbqkbnr', 'w', 'KQkq', ' ', '1', '1']);
        expect(notationLogic.changeMoveClocks(['rnbqkbnr', 'w', 'KQkq', ' ', '1', '1'], [[null]]))
            .toEqual(['rnbqkbnr', 'w', 'KQkq', ' ', '0', '2']);
    });

    

    
});
