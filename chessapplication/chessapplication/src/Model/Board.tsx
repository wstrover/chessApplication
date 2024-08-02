// Board.tsx
import React, { useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Square from './Square';
import { initialBoardSetup } from './boardLogic';
import './Board.css';
import { GameLogic } from './GameLogic';
import { GameConditions } from './gameConditions';
import { Piece, PieceColor, PieceType } from './Piece';
import { notationLogic } from './notationLogic';
import {  updateGameFENHistoryRealTime, updateGameStatusRealTime, updateCompleteGameState, fetchCurrentGameStatus } from '../Controller/firebaseGame';
//import { arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { GameMode } from './gameSetup';
import { realtimeDB } from '../Controller/firebase';
import { ref, onValue, off, get } from "firebase/database";
import { Knight } from './Knight';
import { Bishop } from './Bishop';
import { Rook } from './Rook';
import { Queen } from './Queen';
import {  initializeEngine, sendMove, terminateEngine } from '../Controller/stockfishLogic';

interface BoardProps {
    propGameId: string | null;
    propUserId: string;
    initialSetup?: (Piece | null)[][];
}

declare global {
    interface SpeechRecognition {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: (event: { results: { transcript: string; }[][]; }) => void;
        onerror: (event: { error: any; }) => void;
        start: () => void;
        stop: () => void;
    }

    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
    }

    interface SpeechRecognitionResult {
        transcript: string;
    }

    interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResult[][];
    }

    interface SpeechRecognitionErrorEvent extends Event {
        error: string;
    }
}


const Board: React.FC<BoardProps> = ({ propGameId, propUserId, initialSetup }) => {
    const [board, setBoard] = useState<(Piece | null)[][]>(initialBoardSetup);
    const [activePiece, setActivePiece] = useState<{ piece: Piece | null, position: { x: number, y: number } | null }>({ piece: null, position: null });
    const [possibleMoves, setPossibleMoves] = useState<{ x: number, y: number }[]>([]);

    const [currentFENNotation, setCurrentFENNotation] = useState<(string)[]>(["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", 'w', 'KQkq', '-', '0', '1']);
    const [currentPlayer, setCurrentPlayer] = useState<PieceColor>(PieceColor.White);
    const [userColor, setUserColor] = useState<PieceColor>();


    const [userId, setUserId] = useState(propUserId);
    const [gameId, setGameId] = useState(propGameId);
    const [allPossibleMoves, setAllPossibleMoves] = useState<{
        white: Record<string, { x: number, y: number }[]>,
        black: Record<string, { x: number, y: number }[]>
    }>({ white: {}, black: {} });

    const [gameStatus, setGameStatus] = useState<'checkmate' | 'stalemate' | 'draw' | 'ongoing'>('ongoing');
    const [fenHistory, setFenHistory] = useState<string[]>([]);

    const [gameMode, setGameMode] = useState<GameMode>();

    const [promotionOptions, setPromotionOptions] = useState<{ position: { x: number, y: number}, color: PieceColor } | null>(null);

    const [voiceRecognition, setVoiceRecognition] = useState<SpeechRecognition | null>(null);
    const [isVoiceRecognitionActive, setIsVoiceRecognitionActive] = useState(false);
    const [voiceRecognitionMove, setVoiceRecognitionMove] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);

    const pieceTypeMapping: Record<string, PieceType> = {
        "Queen": PieceType.Queen,
        "Rook": PieceType.Rook,
        "Bishop": PieceType.Bishop,
        "Knight": PieceType.Knight,
    };

    const [stockfishMove, setStockfishMove] = useState<{ from: string, to: string }>({ from: "", to: "" });
    

    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            }
        });
    }, []);

    
    
    useEffect(() => {
        //if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.OnlineMultiplayer) return;
        
        if (gameMode !== GameMode.SingleplayerAI) return;
        console.log("intialise Stockfish");
        const startEngine = async () => {
            await initializeEngine();
        };

        startEngine();
        return () => {
            const stopEngine = async () => {
                await terminateEngine();
            };

            stopEngine();
        };
    }, []);

    const setMove = (uciMove: string) => {
        //if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.OnlineMultiplayer) return;
        if (gameMode !== GameMode.SingleplayerAI) return;
        const moveParts = uciMove.match(/([a-h][1-8])([a-h][1-8])/);
        if (moveParts) {
            const from = notationLogic.notationToSquareLowerCase(moveParts[1]);
            const to = notationLogic.notationToSquareLowerCase(moveParts[2]);
            //console.log(`UCI Move: ${uciMove}`);
            //console.log(`Parsed Move: from ${moveParts[1]} to ${moveParts[2]}`);
            //console.log(`From Square: x=${from.x}, y=${from.y}`);
            //console.log(`To Square: x=${to.x}, y=${to.y}`);
            setStockfishMove({ from: `${from.x},${from.y}`, to: `${to.x},${to.y}` });
        }
    };


    useEffect(() => {
        //if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.OnlineMultiplayer) return;
        if (gameMode !== GameMode.SingleplayerAI) return;
        if (stockfishMove.from !== "" && stockfishMove.to !== "") {
            const from = stockfishMove.from.split(',').map(Number);
            const to = stockfishMove.to.split(',').map(Number);
            //console.log("Applying Stockfish move");
            //console.log(`Move from ${from[0]},${from[1]} to ${to[0]},${to[1]}`);
            handleMove(from[0], from[1], to[0], to[1]);
            setStockfishMove({ from: "", to: "" });
        }
    }, [stockfishMove]);

    useEffect(() => {
        if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.OnlineMultiplayer) return;
        if (gameMode !== GameMode.SingleplayerAI) return;

        const fetchStockfishMove = async () => {
            try {
                if ((userColor === PieceColor.White && currentFENNotation[1] === 'b') ||
                    (userColor === PieceColor.Black && currentFENNotation[1] === 'w')) {
                    console.log("Fetching Stockfish move...");
                    const fen = getFENString(currentFENNotation);
                    //console.log(`Sending FEN to Stockfish: ${fen}`);
                    const bestMove = await sendMove(fen);
                    console.log(`Received best move from Stockfish: ${bestMove}`);
                    setMove(bestMove);
                }
            } catch (error) {
                console.error('Failed to fetch Stockfish move:', error);
                console.log('Failed to fetch Stockfish move:', error);
            }
        };

        fetchStockfishMove();
    }, [currentPlayer, board, currentFENNotation, gameMode, userColor]);




    useEffect(() => {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript.trim().toUpperCase();
            console.log("Voice recognition transcript:", transcript);

            const movePattern = /^[A-H][1-8] TO [A-H][1-8]$/;
            if (!movePattern.test(transcript)) {
                let errorstring = "That is not a proper chess move. Voice recognition transcript:" + transcript;
                
                if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
                    alert(errorstring);
                }
                return;
            }

            const [from, to] = transcript.split(" TO ");
            const fromPos = notationLogic.notationToSquare(from);
            const toPos = notationLogic.notationToSquare(to);

            console.log(fromPos);
            console.log(toPos);
            setVoiceRecognitionMove({ from: fromPos, to: toPos });

        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            const errorString = `Voice recognition error: ${event.error}`;
            if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
                alert(errorString);
            }
        };

        setVoiceRecognition(recognition);
    }, []);



    useEffect(() => {
        if (voiceRecognitionMove) {
            const { from, to } = voiceRecognitionMove;

            const piece = board[from.y][from.x];
            if (!piece) {
                if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
                    alert("No piece at the start position.");
                }
                setVoiceRecognitionMove(null);
                return;
            }

            //console.log(from.x, from.y);
            //console.log(to.x, to.y);
            //console.log(currentFENNotation[1]);
            //console.log('current player: ', currentPlayer);

            const isWhiteToMove = currentFENNotation[1] === 'w';
            if ((isWhiteToMove && piece.color !== PieceColor.White) || (!isWhiteToMove && piece.color !== PieceColor.Black)) {
                if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
                    alert("It's not your turn.");
                }
                setVoiceRecognitionMove(null);
                return;
            }

            const isLegal = GameLogic.possibleMoves(piece, from, board, currentFENNotation, currentPlayer)
                .some(move => move.x === to.x && move.y === to.y);

            if (!isLegal) {
                if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
                    alert("That is not a legal move.");
                }
                setVoiceRecognitionMove(null);
                return;
            }

            
            handleMove(from.x, from.y, to.x, to.y);

            setVoiceRecognitionMove(null);
        }
    }, [voiceRecognitionMove]);


    

    

    const toggleVoiceRecognition = () => {
        if (voiceRecognition) {
            if (isVoiceRecognitionActive) {
                voiceRecognition.stop();
            } else {
                voiceRecognition.start();
            }
            setIsVoiceRecognitionActive(!isVoiceRecognitionActive);
        }
    };

    /*
    const handleVoiceMove = (fromX: number, fromY: number, toX: number, toY: number) => {
        const newBoard = [...board];
        const pieceToMove = newBoard[fromY][fromX];

        newBoard[toY][toX] = pieceToMove;
        newBoard[fromY][fromX] = null;

        if (pieceToMove && pieceToMove.type === PieceType.Pawn && (toY === 0 || toY === 7)) {
            setPromotionOptions({ position: { x: toX, y: toY }, color: pieceToMove.color });

        }

        if (pieceToMove?.type === PieceType.Pawn && Math.abs(toY - fromY) === 2) {
            const enPassantTarget = notationLogic.squareToNotation(toX, pieceToMove.color === PieceColor.White ? toY + 1 : toY - 1);
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, enPassantTarget));
        } else if (pieceToMove?.type === PieceType.King && Math.abs(fromX - toX) === 2) {
            
            if (toX === 6) {
                newBoard[fromY][5] = newBoard[fromY][7];
                newBoard[fromY][7] = null;
            } else if (toX === 2) {
                newBoard[fromY][3] = newBoard[fromY][0];
                newBoard[fromY][0] = null;
            }
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, "-"));
        } else {
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, "-"));
        }

        setBoard(newBoard);
        setActivePiece({ piece: null, position: null });

        if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
            setCurrentPlayer(currentPlayer === PieceColor.White ? PieceColor.Black : PieceColor.White);
        }

        if (gameId) {
            updateFENHistoryIfNeeded(gameId, currentFENNotation);
            updateGameState(board, currentFENNotation, gameId, currentPlayer);
        }
    };


    */
    




    useEffect(() => {
        if (!gameId) return;
        const gameRef = ref(realtimeDB, `games/${gameId}/gameInfo`);
        const boardRef = ref(realtimeDB, `games/${gameId}/boardState`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const gameData = snapshot.val();
            if (gameData && typeof gameData.currentFEN === 'string') {

                setCurrentFENNotation(gameData.currentFEN.split(" "));
                setFenHistory(gameData.fenHistory || []);
                setGameStatus(gameData.gameStatus);
                const updatedBoard = notationLogic.fenToBoard(gameData.currentFEN);
                setBoard(updatedBoard);

                if (gameData.players.white === 'Local' || gameData.players.black === 'Local') {
                    setGameMode(GameMode.LocalSingleplayer);
                } else if (gameData.players.white === 'AI' || gameData.players.black === 'AI') {
                    setGameMode(GameMode.SingleplayerAI);
                    if (gameData.players.white === userId) {
                        setUserColor(PieceColor.White);
                        setCurrentPlayer(PieceColor.White);
                    } else if (gameData.players.black === userId) {
                        setUserColor(PieceColor.Black);
                        setCurrentPlayer(PieceColor.Black);
                    }
                } else {
                    setGameMode(GameMode.OnlineMultiplayer);
                    if (gameData.players.white === userId) {
                        setUserColor(PieceColor.White);
                        setCurrentPlayer(PieceColor.White);
                    } else if (gameData.players.black === userId) {
                        setUserColor(PieceColor.Black);
                        setCurrentPlayer(PieceColor.Black);
                    }
                }
            }
        });
        return () => off(gameRef);
    }, [gameId, userId]);




    useEffect(() => {
        if (board && Array.isArray(board) && board.length === 8 && currentFENNotation && Array.isArray(currentFENNotation)) {
            const whiteMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.White);
            const blackMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.Black);
            setAllPossibleMoves({ white: whiteMoves, black: blackMoves });
        }

    }, [board, currentFENNotation]);







    useEffect(() => {
        if (activePiece.piece && activePiece.position) {
            const posKey = `${activePiece.position.x},${activePiece.position.y}`;
            const colorMoves = activePiece.piece.color === PieceColor.White ? allPossibleMoves.white : allPossibleMoves.black;
            const moves = colorMoves[posKey] || [];
            setPossibleMoves(moves);
        } else {
            setPossibleMoves([]);
        }
    }, [activePiece, allPossibleMoves]);



    

    useEffect(() => {
        let ignore = false;

        async function updateGameState() {
            if (!board || board.flat().every(cell => cell === null) || !gameId) {
                return;
            }
            const currentStatus = await fetchCurrentGameStatus(gameId);
            if (currentStatus !== 'ongoing') {

                return;
            }

            try {
                const isAllPossibleMovesDefined = allPossibleMoves.white && Object.keys(allPossibleMoves.white).length > 0 &&
                    allPossibleMoves.black && Object.keys(allPossibleMoves.black).length > 0;

                if (!isAllPossibleMovesDefined) {
                    const whiteMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.White);
                    const blackMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.Black);
                    setAllPossibleMoves({ white: whiteMoves, black: blackMoves });
                    return
                }

                const updatedGameStatus = GameConditions.calculateGameStatus(allPossibleMoves, board, currentPlayer);

                const currentFEN = getFENString(currentFENNotation);


                if (!ignore && (gameStatus !== updatedGameStatus || !fenHistory.includes(currentFEN))) {
                    if (gameStatus !== updatedGameStatus) {
                        setGameStatus(updatedGameStatus);
                        await updateGameStatusRealTime(gameId, updatedGameStatus, userId);
                    }

                    if (!fenHistory.includes(currentFEN)) {
                        updateFENHistoryIfNeeded(gameId, currentFENNotation);
                    }
                }
                if (updatedGameStatus !== 'ongoing') {
                    const fenHistoryRef = ref(realtimeDB, `games/${gameId}/fenHistory`);
                    const fenSnapshot = await get(fenHistoryRef);
                    const realTimeFENHistory = fenSnapshot.exists() ? Object.values(fenSnapshot.val() as Record<string, { newFEN: string }> || {}).map(entry => entry.newFEN) : [];

                    await updateCompleteGameState(gameId, updatedGameStatus, userId, currentFEN, realTimeFENHistory);
                }
            } catch (error) {
                console.error("Failed to update game state:", error);
            }
        }

        updateGameState();

        return () => { ignore = true; };
    }, [gameId, board, currentFENNotation, currentPlayer]);



    const updateFENHistoryIfNeeded = async (gameId: string, currentFEN: string[]) => {
        const currentFENForDB = getFENString(currentFEN);
        if (!fenHistory.includes(currentFENForDB)) {
            setFenHistory(prev => [...prev, currentFENForDB]);
            await updateGameFENHistoryRealTime(gameId, currentFENForDB);
        }
    };
    /*
    const isPlayersTurn = () => {
        return (currentFENNotation[1] === 'w' && currentPlayer === PieceColor.White) ||
            (currentFENNotation[1] === 'b' && currentPlayer === PieceColor.Black);
    };

    const makeAIMove1noSF = () => {

        if (gameMode === GameMode.SingleplayerAI && ((currentPlayer === PieceColor.Black && userColor === PieceColor.White) || (currentPlayer === PieceColor.White && userColor === PieceColor.Black))) {
            const aiMoves = currentPlayer === PieceColor.White ? allPossibleMoves.white : allPossibleMoves.black;
            const aiPieces = Object.keys(aiMoves);
            if (aiPieces.length > 0) {
                const randomPieceIndex = Math.floor(Math.random() * aiPieces.length);
                const randomPiece = aiPieces[randomPieceIndex];
                const possibleMoves = aiMoves[randomPiece];
                if (possibleMoves.length > 0) {
                    const randomMoveIndex = Math.floor(Math.random() * possibleMoves.length);
                    const randomMove = possibleMoves[randomMoveIndex];
                    const [fromX, fromY] = randomPiece.split(',').map(Number);
                    const { x: toX, y: toY } = randomMove;
                    handleMove(fromX, fromY, toX, toY);
                }
            }
        }
    };

    */

    const handleMove = (fromX: number, fromY: number, toX: number, toY: number) => {


        //const newBoard = [...board];
        const pieceToMove = board[fromY][fromX];
        if (!pieceToMove) {
            return;
        }

        board[toY][toX] = pieceToMove;
        board[fromY][fromX] = null;

        
        if (pieceToMove.type === PieceType.Pawn && (toY === 0 || toY === 7)) {
            setPromotionOptions({ position: { x: toX, y: toY }, color: pieceToMove.color });
        } else {
            finalizeMove(board, pieceToMove, fromX, fromY, toX, toY);
        }

        setActivePiece({ piece: null, position: null });

        if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
            setCurrentPlayer(currentPlayer === PieceColor.White ? PieceColor.Black : PieceColor.White);
        }

        
        
        



    };

    const finalizeMove = (newBoard: (Piece | null)[][], pieceToMove: Piece, fromX: number, fromY: number, toX: number, toY: number) => {
        if (pieceToMove.type === PieceType.Pawn && Math.abs(toY - fromY) === 2) {
            const enPassantTarget = notationLogic.squareToNotation(toX, pieceToMove.color === PieceColor.White ? toY + 1 : toY - 1);
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, enPassantTarget));
        } else if (pieceToMove.type === PieceType.King && Math.abs(fromX - toX) === 2) {
            if (toX === 6) {
                newBoard[fromY][5] = newBoard[fromY][7];
                newBoard[fromY][7] = null;
            } else if (toX === 2) {
                newBoard[fromY][3] = newBoard[fromY][0];
                newBoard[fromY][0] = null;
            }
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, "-"));
        } else {
            setCurrentFENNotation(notationLogic.changeFullFEN(currentFENNotation, newBoard, "-"));
        }

        if (gameMode === GameMode.LocalSingleplayer || gameMode === GameMode.SingleplayerAI) {
            setCurrentPlayer(currentPlayer === PieceColor.White ? PieceColor.Black : PieceColor.White);
        }

        if (gameId) {
            updateFENHistoryIfNeeded(gameId, currentFENNotation);
            updateGameState(newBoard, currentFENNotation, gameId, currentPlayer);
        }
    };

    const promotePawn = (newType: PieceType) => {
        if (!promotionOptions) return;
        const { position, color } = promotionOptions;
        const newBoard = [...board];
        if (gameMode === GameMode.SingleplayerAI && ((userColor === PieceColor.White && currentFENNotation[1] === 'b') ||
            (userColor === PieceColor.Black && currentFENNotation[1] === 'w'))) {
            newBoard[position.y][position.x] = new Queen(color);
            setBoard(newBoard);
            setPromotionOptions(null);

            finalizeMove(newBoard, newBoard[position.y][position.x]!, position.x, position.y, position.x, position.y);

            return;
            }
        switch (newType) {
            case PieceType.Queen:
                newBoard[position.y][position.x] = new Queen(color);
                break;
            case PieceType.Rook:
                newBoard[position.y][position.x] = new Rook(color);
                break;
            case PieceType.Bishop:
                newBoard[position.y][position.x] = new Bishop(color);
                break;
            case PieceType.Knight:
                newBoard[position.y][position.x] = new Knight(color);
                break;
        }

        setBoard(newBoard);
        setPromotionOptions(null);

        finalizeMove(newBoard, newBoard[position.y][position.x]!, position.x, position.y, position.x, position.y);
    };


    const updateGameState = async (board: (Piece | null)[][], currentFENNotation: string[], gameId: string, currentPlayer: PieceColor) => {
        if (!gameId) return;

        const whiteMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.White);
        const blackMoves = GameLogic.calculateAllPossibleMoves(board, currentFENNotation, PieceColor.Black);

        setAllPossibleMoves({ white: whiteMoves, black: blackMoves });

        const updatedGameStatus = GameConditions.calculateGameStatus({ white: whiteMoves, black: blackMoves }, board, currentPlayer);
        setGameStatus(updatedGameStatus);

        const currentFEN = getFENString(currentFENNotation);

        if (updatedGameStatus !== 'ongoing' || !fenHistory.includes(currentFEN)) {
            await updateGameStatusRealTime(gameId, updatedGameStatus, userId);
            await updateFENHistoryIfNeeded(gameId, currentFENNotation);
        }

        if (updatedGameStatus !== 'ongoing') {
            const fenHistoryRef = ref(realtimeDB, `games/${gameId}/fenHistory`);
            const fenSnapshot = await get(fenHistoryRef);
            const realTimeFENHistory = fenSnapshot.exists() ? Object.values(fenSnapshot.val() as Record<string, { newFEN: string }> || {}).map(entry => entry.newFEN) : [];

            await updateCompleteGameState(gameId, updatedGameStatus, userId, currentFEN, realTimeFENHistory);
        }
    };




    const handleSquareClick = (x: number, y: number) => {
        const clickedPiece = board[y][x];
        if (activePiece.position && activePiece.position.x === x && activePiece.position.y === y) {
            setActivePiece({ piece: null, position: null });
            return;
        }

        if (activePiece.piece && activePiece.position) {
            const fromPosKey = `${activePiece.position.x},${activePiece.position.y}`;
            const colorMoves = activePiece.piece.color === PieceColor.White ? allPossibleMoves.white : allPossibleMoves.black;
            const moves = colorMoves[fromPosKey] || [];

            if (moves.some((move: { x: number; y: number }) => move.x === x && move.y === y)) {
                if ((currentFENNotation[1] === 'w' && activePiece.piece.color === PieceColor.White) ||
                    (currentFENNotation[1] === 'b' && activePiece.piece.color === PieceColor.Black)) {
                    handleMove(activePiece.position.x, activePiece.position.y, x, y);
                }
            } else if (clickedPiece && clickedPiece.color === currentPlayer) {
                setActivePiece({ piece: clickedPiece, position: { x, y } });
            }
        } else if (clickedPiece && clickedPiece.color === currentPlayer) {
            setActivePiece({ piece: clickedPiece, position: { x, y } });
        } else {
            setActivePiece({ piece: null, position: null });
        }
    };





    return (
        <div className="game-page-container">
            <div className="voice-recognition-container">
                <button className="voice-recognition-btn" onClick={toggleVoiceRecognition}>
                    {isVoiceRecognitionActive ? "Stop Voice Recognition" : "Start Voice Recognition"}
                </button>
            </div>

            <div className="board-container">
                <div className="board-grid">
                    <div className="label-row">
                        <div className="label-placeholder" />
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, idx) => (
                            <div key={idx} className="file-label">{file}</div>
                        ))}
                        <div className="label-placeholder" />
                    </div>

                    {board ? (userColor === PieceColor.Black ? [...board].reverse() : board).map((row, index) => {
                        const y = userColor === PieceColor.Black ? 7 - index : index;
                        return (
                            <div key={`row-${y}`} className="board-row">
                                <div className="rank-label">{8 - y}</div>
                                {row.map((piece, x) => {
                                    const isDark = (x + y) % 2 === 1;
                                    return (
                                        <Square
                                            key={`square-${x}-${y}`}
                                            piece={piece}
                                            x={x}
                                            y={y}
                                            onSquareClick={() => handleSquareClick(x, y)}
                                            isActive={activePiece.position?.x === x && activePiece.position?.y === y}
                                            isHighlighted={possibleMoves.some(move => move.x === x && move.y === y)}
                                            isDark={isDark}
                                        />
                                    );
                                })}
                                <div className="rank-label">{8 - y}</div>
                            </div>
                        );
                    }) : <div>Loading board...</div>}

                    <div className="label-row">
                        <div className="label-placeholder" />
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, idx) => (
                            <div key={idx} className="file-label">{file}</div>
                        ))}
                        <div className="label-placeholder" />
                    </div>
                </div>
            </div>

            {promotionOptions && (
                <div className="promotion-modal">
                    <div className="promotion-modal-content">
                        <h3>Promote Pawn</h3>
                        {Object.keys(pieceTypeMapping).map((pieceName, idx) => (
                            <button key={idx} onClick={() => promotePawn(pieceTypeMapping[pieceName])}>
                                {pieceName}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );




};

export const getFENString = (currentFENNotation: string[]): string => {
    let FullFen = '';
    currentFENNotation.forEach(FENPart => {
        FullFen = FullFen + FENPart + ' ';
    });
    return FullFen.trim();
};


export default Board;

