// Pawn.ts
import { Piece, PieceType, PieceColor } from './Piece';
//import whiteImagePath from '../images/white_pawn.png'


export class Pawn extends Piece {
    constructor(color: PieceColor) {
        super(PieceType.Pawn, color);
    }
}
