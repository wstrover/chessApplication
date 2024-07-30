// gameConditions.ts
import { Piece, PieceColor, PieceType } from './Piece';
import { GameLogic } from './GameLogic';

interface Position {
    x: number;
    y: number;
}

export class GameConditions {
    
    static isCheckmate(allPossibleMoves: Record<string, { x: number, y: number }[]>, board: (Piece | null)[][], kingPosition: Position, kingColor: PieceColor): boolean {
        if (this.isKingInCheck(board, kingPosition, kingColor)) {
            const hasLegalMoves = Object.values(allPossibleMoves).some(moves => moves.length > 0);
            console.log(`Checking for checkmate: King is in check and has legal moves: ${hasLegalMoves}`);
            return !hasLegalMoves;
        }
        return false;
    }


    static isStalemate(allPossibleMoves: Record<string, { x: number, y: number }[]>, board: (Piece | null)[][], kingPosition: Position, kingColor: PieceColor): boolean {
        if (!this.isKingInCheck(board, kingPosition, kingColor) && Object.values(allPossibleMoves).every(moves => moves.length === 0)) {
            return true;
        }
        return false;
    }

    static isDrawByInsufficientMaterial(board: (Piece | null)[][]): boolean {
        const pieces = board.flat().filter(Boolean);
        const types = pieces.map(piece => piece!.type);
        const uniquePieces = new Set(types);
        if (pieces.length === 2) return true; 
        if (pieces.length === 3 && (uniquePieces.has(PieceType.Bishop) || uniquePieces.has(PieceType.Knight))) return true; 
        if (pieces.every(p => [PieceType.Bishop, PieceType.King].includes(p!.type)) && new Set(pieces.map(p => p!.color)).size === 1) return true; 
        return false;
    }

    static isKingInCheck(board: (Piece | null)[][], kingPosition: Position, kingColor: PieceColor): boolean {
        return GameLogic.isKingDirectlyThreatened(kingPosition, board, kingColor);
    }

   

    static findKingsPositions(board: (Piece | null)[][]): Record<PieceColor, Position | null> {
        const positions: Record<PieceColor, Position | null> = { [PieceColor.White]: null, [PieceColor.Black]: null };
        board.forEach((row, y) => {
            row.forEach((piece, x) => {
                if (piece && piece.type === PieceType.King) {
                    positions[piece.color] = { x, y };
                }
            });
        });
        return positions;
    }

    static calculateGameStatus(
        allPossibleMoves: {
            white: Record<string, { x: number; y: number }[]>,
            black: Record<string, { x: number; y: number }[]>
        },
        board: (Piece | null)[][],
        currentPlayer: PieceColor
    ): 'checkmate' | 'stalemate' | 'draw' | 'ongoing' {
        const kingPositions = this.findKingsPositions(board);

        //console.log(`Calculating game status for player ${currentPlayer}`);
        //console.log(`King positions:`, kingPositions);
        /*
        console.log("Possible white moves:");
        Object.entries(allPossibleMoves.white).forEach(([piece, moves]) => {
            console.log(`${piece}: ${moves.map(move => `(${move.x}, ${move.y})`).join(', ')}`);
        });

        console.log("Possible black moves:");
        Object.entries(allPossibleMoves.black).forEach(([piece, moves]) => {
            console.log(`${piece}: ${moves.map(move => `(${move.x}, ${move.y})`).join(', ')}`);
        });
        */

        for (const color of [PieceColor.White, PieceColor.Black]) {
            const kingPosition = kingPositions[color];
            if (kingPosition) {
                const isCheck = this.isKingInCheck(board, kingPosition, color);
                const moves = allPossibleMoves[color === PieceColor.White ? 'white' : 'black'];
                const hasMoves = Object.values(moves).some(movesArray => movesArray.length > 0);


                if (color === currentPlayer) {
                    if (isCheck && !hasMoves) {
                        return 'checkmate';
                    }
                    else if (!isCheck && !hasMoves) {
                        return 'stalemate';
                    }
                }
            }
        }

        if (this.isDrawByInsufficientMaterial(board)) {
            return 'draw';
        }

        return 'ongoing';
    }

    


}