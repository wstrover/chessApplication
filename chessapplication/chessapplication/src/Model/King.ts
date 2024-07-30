// King.ts
import { Piece, PieceType, PieceColor } from './Piece';

export class King extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.King, color, false);
    }
}
