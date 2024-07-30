// GameLogic.ts

import { notationLogic } from './notationLogic';
import { GameConditions } from './gameConditions';
import { Piece, PieceType, PieceColor } from './Piece';

interface Position {
    x: number;
    y: number;
}

export class GameLogic {

    
    

    static possibleMoves(piece: Piece, position: Position, board: (Piece | null)[][], currentFENNotation: string[], currentPlayer: PieceColor): { x: number, y: number }[] {
        let rawMoves: { x: number, y: number }[] = []; 

        switch (piece.type) {
            case PieceType.Pawn:
                rawMoves = this.possiblePawnMoves(piece, position, board, currentFENNotation[3]);
                break;
            case PieceType.Rook:
                rawMoves = this.possibleRookMoves(piece, position, board);
                break;
            case PieceType.Knight:
                rawMoves = this.possibleKnightMoves(piece, position, board);
                break;
            case PieceType.Bishop:
                rawMoves = this.possibleBishopMoves(piece, position, board);
                break;
            case PieceType.Queen:
                rawMoves = this.possibleQueenMoves(piece, position, board);
                break;
            case PieceType.King:
                rawMoves = this.possibleKingMoves(piece, position, board, currentFENNotation);
                break;
            default:
                rawMoves = []; 
        }

        const safeMoves = rawMoves.filter(move => {
            let tempBoard = JSON.parse(JSON.stringify(board)); 
            tempBoard[move.y][move.x] = piece; 
            tempBoard[position.y][position.x] = null; 

            const kingPos = this.findKingPosition(currentPlayer, tempBoard);
            if (!kingPos) {
                return false; 
            }

            return !this.isKingDirectlyThreatened(kingPos, tempBoard, currentPlayer);
        });

        return safeMoves;
    }


    

    static isKingDirectlyThreatened(kingPosition: Position, board: (Piece | null)[][], kingColor: PieceColor): boolean {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, 
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, 
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 } 
        ];

        const knightMoves = [
            { dx: 2, dy: 1 }, { dx: 2, dy: -1 }, { dx: -2, dy: 1 }, { dx: -2, dy: -1 },
            { dx: 1, dy: 2 }, { dx: 1, dy: -2 }, { dx: -1, dy: 2 }, { dx: -1, dy: -2 }
        ];

        const pawnAttackOffsets = kingColor === PieceColor.White
            ? [{ dx: 1, dy: -1 }, { dx: -1, dy: -1 }]
            : [{ dx: 1, dy: 1 }, { dx: -1, dy: 1 }]; 

        for (const { dx, dy } of pawnAttackOffsets) {
            const x = kingPosition.x + dx;
            const y = kingPosition.y + dy;
            if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const piece = board[y][x];
                if (piece && piece.type === PieceType.Pawn && piece.color !== kingColor) {
                    return true;
                }
            }
        }

        for (const { dx, dy } of directions) {
            let x = kingPosition.x + dx;
            let y = kingPosition.y + dy;
            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const piece = board[y][x];
                if (piece) {
                    if (piece.color !== kingColor && (
                        (dx === 0 || dy === 0) && (piece.type === PieceType.Rook || piece.type === PieceType.Queen) ||
                        (dx !== 0 && dy !== 0) && (piece.type === PieceType.Bishop || piece.type === PieceType.Queen)
                    )) {
                        return true;
                    }
                    break; 
                }
                x += dx;
                y += dy;
            }
        }

        
        for (const { dx, dy } of knightMoves) {
            const x = kingPosition.x + dx;
            const y = kingPosition.y + dy;
            if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const piece = board[y][x];
                if (piece && piece.type === PieceType.Knight && piece.color !== kingColor) {
                    return true;
                }
            }
        }

        return false; // No threats found
    }



    static simulateMoveAndCheckKingSafety(from: Position, to: Position, board: (Piece | null)[][], kingColor: PieceColor): boolean {
        let tempBoard = JSON.parse(JSON.stringify(board)); 
        tempBoard[to.y][to.x] = tempBoard[from.y][from.x]; 
        tempBoard[from.y][from.x] = null; 

        const kingPosition = this.findKingPosition(kingColor, tempBoard);
        if (!kingPosition) {
            return false; 
        }

        return this.isKingDirectlyThreatened(kingPosition, tempBoard, kingColor);
    }


    static possiblePawnMoves(piece: Piece, position: { x: number, y: number }, board: (Piece | null)[][], enPassantSquare: string): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const direction = piece.color === PieceColor.White ? -1 : 1;
        const startRow = piece.color === PieceColor.White ? 6 : 1;
        const oneStepForward = position.y + direction;
        const twoStepsForward = position.y + 2 * direction;

        //  one step forward
        if (oneStepForward >= 0 && oneStepForward < 8 && !board[oneStepForward][position.x]) {
            moves.push({ x: position.x, y: oneStepForward });
            if (position.y === startRow && !board[twoStepsForward][position.x]) {
                moves.push({ x: position.x, y: twoStepsForward });
            }
        }

        // diagonal captures
        const captureOffsets = [-1, 1];
        captureOffsets.forEach(offset => {
            const captureX = position.x + offset;
            if (captureX >= 0 && captureX < 8 && oneStepForward >= 0 && oneStepForward < 8) {
                const target = board[oneStepForward][captureX];
                if (target && target.color !== piece.color) {
                    moves.push({ x: captureX, y: oneStepForward });
                }
            }
        });

        // En passant captures
        if (enPassantSquare !== "-") {
            const enPassantCoords = notationLogic.notationToSquare(enPassantSquare);
            if ((piece.color === PieceColor.White && position.y === 3) || (piece.color === PieceColor.Black && position.y === 4)) {
                captureOffsets.forEach(offset => {
                    const captureX = position.x + offset;
                    if (captureX === enPassantCoords.x && oneStepForward === enPassantCoords.y) {
                        moves.push({ x: captureX, y: oneStepForward }); 
                    }
                });
            }
        }

        return moves;
    }




    static possibleBishopMoves(piece: Piece, position: { x: number, y: number }, board: (Piece | null)[][]): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const increments = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        increments.forEach(([xI, yI]) => {
            let x = position.x + xI;
            let y = position.y + yI;

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const square = board[y][x];

                if (square === null) {
                    moves.push({ x, y });
                    x += xI;
                    y += yI;
                } else {
                    if (square.color !== piece.color) {
                        moves.push({ x, y });
                    }
                    break;
                }
            }
        });

        



        return moves;
    }


    static possibleRookMoves(piece: Piece, position: { x: number, y: number }, board: (Piece | null)[][]): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const increments = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        increments.forEach(([xI, yI]) => {
            let x = position.x + xI;
            let y = position.y + yI;

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const square = board[y][x];
                if (square === null) {
                    moves.push({ x, y });
                    x += xI;
                    y += yI;
                } else {
                    if (square.color !== piece.color) {
                        moves.push({ x, y });
                    } 
                    break;
                }
            }
        });

        return moves;
    }


    static possibleQueenMoves(piece: Piece, position: { x: number, y: number }, board: (Piece | null)[][]): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const perpendicularIncrements = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const DiagnalIncrements = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        perpendicularIncrements.forEach(([xI, yI]) => {
            let x = position.x + xI;
            let y = position.y + yI;

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const square = board[y][x];
                if (square === null) {
                    moves.push({ x, y });
                    x += xI;
                    y += yI;
                } else {
                    if (square.color !== piece.color) {
                        moves.push({ x, y });
                    } 
                    break;
                }
            }
        });



        

        DiagnalIncrements.forEach(([xI, yI]) => {
            let x = position.x + xI;
            let y = position.y + yI;

            while (x >= 0 && x < 8 && y >= 0 && y < 8) {
                const square = board[y][x];

                if (square === null) {
                    moves.push({ x, y });
                    x += xI;
                    y += yI;
                } else {
                    if (square.color !== piece.color) {
                        moves.push({ x, y });
                    }
                    break;
                }
            }
        });



        return moves;
    }

    static possibleKnightMoves(piece: Piece, position: { x: number, y: number }, board: (Piece | null)[][]): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const offsets: number[] = [1, -1, 2, -2];

        offsets.forEach((xOffset) => {
            if (xOffset !== 0) {
                offsets.forEach((yOffset) => {
                    if (yOffset !== 0 && Math.abs(xOffset) !== Math.abs(yOffset)) {
                        const x = position.x + xOffset;
                        const y = position.y + yOffset;

                        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                            const targetSquare = board[y][x];

                            if (!targetSquare || targetSquare.color !== piece.color) {
                                moves.push({ x: x, y: y });
                            }
                        }
                    }
                });
            }
        });

        return moves;
    }



    static possibleKingMoves(piece: Piece, position: Position, board: (Piece | null)[][], currentFENNotation: string[]): { x: number, y: number }[] {
        const moves: { x: number, y: number }[] = [];
        const increments = [-1, 0, 1];

        // Normal King Moves
        increments.forEach(xIncrement => {
            increments.forEach(yIncrement => {
                if (!(xIncrement === 0 && yIncrement === 0)) {
                    const newX = position.x + xIncrement;
                    const newY = position.y + yIncrement;

                    if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                        const targetSquare = board[newY][newX];
                        if (!targetSquare || targetSquare.color !== piece.color) {
                            moves.push({ x: newX, y: newY });
                        }
                    }
                }
            });
        });

        // Castling
        if (piece.hasMoved === false || piece.hasMoved === undefined) {
            const kingSide = piece.color === PieceColor.White ? 'K' : 'k';
            const queenSide = piece.color === PieceColor.White ? 'Q' : 'q';

            if (currentFENNotation[2].includes(kingSide)) {
                if (!board[position.y][5] && !board[position.y][6] &&
                    this.isPathClear(board, position, { x: 5, y: position.y }) &&
                    this.isPathClear(board, position, { x: 6, y: position.y }) &&
                    !this.isKingDirectlyThreatened(position, board, piece.color) &&
                    !this.isKingDirectlyThreatened({ x: 5, y: position.y }, board, piece.color) &&
                    !this.isKingDirectlyThreatened({ x: 6, y: position.y }, board, piece.color)) {
                    moves.push({ x: position.x + 2, y: position.y });
                }
            }

            if (currentFENNotation[2].includes(queenSide)) {
                if (!board[position.y][1] && !board[position.y][2] && !board[position.y][3] &&
                    this.isPathClear(board, position, { x: 1, y: position.y }) &&
                    this.isPathClear(board, position, { x: 2, y: position.y }) &&
                    this.isPathClear(board, position, { x: 3, y: position.y }) &&
                    !this.isKingDirectlyThreatened(position, board, piece.color) &&
                    !this.isKingDirectlyThreatened({ x: 2, y: position.y }, board, piece.color) &&
                    !this.isKingDirectlyThreatened({ x: 3, y: position.y }, board, piece.color)) {
                    moves.push({ x: position.x - 2, y: position.y });
                }
            }
        }

        return moves;
    }

    
    static isPathClear(board: (Piece | null)[][], from: Position, to: Position): boolean {
        const step = to.x > from.x ? 1 : -1;
        for (let x = from.x + step; x !== to.x; x += step) {
            if (board[from.y][x]) return false; // There's a piece in the way
        }
        return true;
    }



    
    
    static findKingPosition(player: PieceColor, board: (Piece | null)[][]): Position | null {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const piece = board[y][x];
                if (piece && piece.type === PieceType.King && piece.color === player) {
                    return { x, y };
                }
            }
        }
        return null; 
    }

    

    static calculateAllPossibleMoves(board: (Piece | null)[][], currentFENNotation: string[], currentPlayer: PieceColor): Record<string, { x: number, y: number }[]> {
        const allMoves: Record<string, { x: number, y: number }[]> = {};

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const piece = board[y][x];
                if (piece && piece.color === currentPlayer) {
                    const posKey = `${x},${y}`;
                    allMoves[posKey] = this.possibleMoves(piece, { x, y }, board, currentFENNotation, currentPlayer);
                }
            }
        }

        return allMoves;
    }









}
