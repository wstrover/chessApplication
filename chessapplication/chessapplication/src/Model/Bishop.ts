// Bishop.ts
import { Piece, PieceType, PieceColor } from './Piece';

export class Bishop extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.Bishop, color, false);
    }
}
