// Knight.ts
import { Piece, PieceType, PieceColor } from './Piece';

export class Knight extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.Knight, color);
    }
}
