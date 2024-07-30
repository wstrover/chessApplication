// Queen.ts
import { Piece, PieceType, PieceColor } from './Piece';

export class Queen extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.Queen, color);
    }
}
