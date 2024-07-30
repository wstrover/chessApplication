// Rook.ts
import { Piece, PieceType, PieceColor } from './Piece';

export class Rook extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.Rook, color);
    }
}
