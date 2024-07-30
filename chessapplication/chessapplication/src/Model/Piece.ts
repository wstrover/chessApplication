// Model/Piece.ts

import { images } from './images';

export enum PieceType {
    Pawn, Rook, Knight, Bishop, Queen, King
}

export enum PieceColor {
    White, Black
}

export abstract class Piece {
    imageUrl: string;

    constructor(public type: PieceType, public color: PieceColor, public hasMoved?: boolean) {
        this.imageUrl = this.setImageUrl(type, color);
    }

    private setImageUrl(type: PieceType, color: PieceColor): string {
        const colorPrefix = color === PieceColor.White ? 'W' : 'B';
        const typeName = PieceType[type];
        const key = `Set 2 ${colorPrefix}${typeName}` as keyof typeof images;
        return images[key];
    }
}
