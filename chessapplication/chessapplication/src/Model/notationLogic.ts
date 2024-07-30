// notationLogic.ts
import { Piece, PieceType, PieceColor } from './Piece';
import { Pawn } from './Pawn';
import { Rook } from './Rook';
import { Knight } from './Knight';
import { Bishop } from './Bishop';
import { Queen } from './Queen';
import { King } from './King';

export class notationLogic{

    static changeFullFEN(fullFen: string[], board: (Piece | null)[][], enPassantTarget: string): string[] {
        
        let newFEN = [...fullFen];
        newFEN[0] = this.getBoardFEN(board);
        newFEN = this.changeTurn(newFEN);
        newFEN = this.changeEnPassantTarget(newFEN, enPassantTarget);
        newFEN = this.changeMoveClocks(newFEN, board);
        newFEN = this.changeCastlingAvailability(newFEN, board);

        

        return newFEN;
    }

    static changeTurn(fullFen: string[]): string[] {
        if (fullFen[1] === 'w') {
            fullFen[1] = 'b';
        } else if (fullFen[1] === 'b') {
            fullFen[1] = 'w';
        }
        
        return fullFen;
    }
    static getBoardFEN(board: (Piece | null)[][]): string {
        let boardFEN = '';
        for (let row of board) {
            let rowFEN = '';
            let emptyCounter = 0;
            for (let square of row) {
                if (square) {
                    if (emptyCounter > 0) {
                        rowFEN += emptyCounter;
                        emptyCounter = 0;
                    }
                    rowFEN += this.getPieceFEN(square);
                } else {
                    emptyCounter++;
                }
            }
            if (emptyCounter > 0) {
                rowFEN += emptyCounter;
            }
            boardFEN += rowFEN + '/';
        }
        return boardFEN.slice(0, -1); 
    }

    static getPieceFEN(piece: Piece): string {
        switch (piece.type) {
            case PieceType.Pawn:
                return piece.color === PieceColor.White ? 'P' : 'p';
            case PieceType.Rook:
                return piece.color === PieceColor.White ? 'R' : 'r';
            case PieceType.Knight:
                return piece.color === PieceColor.White ? 'N' : 'n';
            case PieceType.Bishop:
                return piece.color === PieceColor.White ? 'B' : 'b';
            case PieceType.Queen:
                return piece.color === PieceColor.White ? 'Q' : 'q';
            case PieceType.King:
                return piece.color === PieceColor.White ? 'K' : 'k';
            default:
                return '';
        }
    }
    

    static changeCastlingAvailability(fullFen: string[], board: (Piece | null)[][]): string[] {
        let castlingRights = fullFen[2];

        // is castles move
        if (!board[7][0] || board[7][0]?.type !== PieceType.Rook || board[7][0]?.color !== PieceColor.White) {
            castlingRights = castlingRights.replace('Q', '');
        }
        if (!board[7][7] || board[7][7]?.type !== PieceType.Rook || board[7][7]?.color !== PieceColor.White) {
            castlingRights = castlingRights.replace('K', '');
        }
        if (!board[0][0] || board[0][0]?.type !== PieceType.Rook || board[0][0]?.color !== PieceColor.Black) {
            castlingRights = castlingRights.replace('q', '');
        }
        if (!board[0][7] || board[0][7]?.type !== PieceType.Rook || board[0][7]?.color !== PieceColor.Black) {
            castlingRights = castlingRights.replace('k', '');
        }

        // if kings move
        if (!board[7][4] || board[7][4]?.type !== PieceType.King ) {
            castlingRights = castlingRights.replace('K', '').replace('Q', '');
        }
        if (!board[0][4] || board[0][4]?.type !== PieceType.King ) {
            castlingRights = castlingRights.replace('k', '').replace('q', '');
        }

        // If no castling rights remain, mark it as "-"
        if (castlingRights === '') {
            castlingRights = '-';
        }

        fullFen[2] = castlingRights;
        return fullFen;
    }




    static changeEnPassantTarget(fullFen: string[], target: string): string[] {
        
        fullFen[3] = target;
        return fullFen;
    }




    static getSquareNotation(x: number, y: number): string {
        const file = String.fromCharCode('a'.charCodeAt(0) + x);
        const rank = String(8 - y);
        return file + rank;
    }

    static changeMoveClocks(fullFen: string[], board: (Piece | null)[][]): string[] {
        if (fullFen[4] === '0') {
            fullFen[4] = '1';
        } else if (fullFen[4] === '1') {
            fullFen[4] = '0';
            let conVar = 1 + +fullFen[5];
            fullFen[5] = String(conVar);
            
        }
        return fullFen;
    }


    static squareToNotation(x: number, y: number): string {
        const file = String.fromCharCode('A'.charCodeAt(0) + x);
        const rank = String(8 - y);
        return file + rank;
    }

    static notationToSquare(notation: string): { x: number, y: number } {
        const file = notation.charCodeAt(0) - 'A'.charCodeAt(0);
        const rank = 8 - parseInt(notation.charAt(1));
        return { x: file, y: rank };
    }

    static notationToSquareLowerCase(notation: string): { x: number, y: number } {
        const file = notation.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = 8 - parseInt(notation.charAt(1));
        return { x: file, y: rank };
    }

    static fenToBoard(fen: string): (Piece | null)[][] {
        const parts = fen.split(" ");
        const rows = parts[0].split("/");
        const board: (Piece | null)[][] = [];

        rows.forEach((row, rowIndex) => {
            const boardRow: (Piece | null)[] = [];
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                const number = parseInt(char);
                if (!isNaN(number)) {
                    for (let j = 0; j < number; j++) {
                        boardRow.push(null);
                    }
                } else {
                    const piece = this.charToPiece(char);
                    if (piece) {
                        boardRow.push(piece);
                    }
                }
            }
            board.push(boardRow);
        });

        return board;
    }

    static charToPiece(char: string): Piece | null {
        const color = char === char.toUpperCase() ? PieceColor.White : PieceColor.Black;
        switch (char.toLowerCase()) {
            case 'p': return new Pawn(color);
            case 'r': return new Rook(color);
            case 'n': return new Knight(color);
            case 'b': return new Bishop(color);
            case 'q': return new Queen(color);
            case 'k': return new King(color);
            default: return null;
        }
    } 


    
}