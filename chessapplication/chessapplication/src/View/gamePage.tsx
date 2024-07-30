// gamePage.tsx
import { get, off, onValue, ref, remove } from 'firebase/database';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Player, updateEloRatings } from '../Controller/eloLogic';
import { db, realtimeDB } from '../Controller/firebase';
import { addGameToUserCollection, fetchOpponentIdAndUpdateGameStatus } from '../Controller/firebaseGame';
import { getUserElo, updatePlayerElo } from '../Controller/firebaseUser';
import Board from '../Model/Board';
import './gamePage.css'; 

interface GamePageProps {
    gameId: string | null;
    userId: string;
    opponentElo: number;
    onBackToMenu: () => void; 
}

interface FenHistoryEntry {
    newFEN: string;
}

const GamePage: React.FC<GamePageProps> = ({ gameId, userId, opponentElo, onBackToMenu }) => {

    const [timerWhite, setTimerWhite] = useState(1000); 
    const [timerBlack, setTimerBlack] = useState(300); 
    const [currentFEN, setCurrentFEN] = useState('');
    const [gameData, setGameData] = useState<any>(null);
    const [endMessage, setEndMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) return;

        const gameRef = ref(realtimeDB, `games/${gameId}/gameInfo`);
        const unsubscribe = onValue(gameRef, async (snapshot) => {
            if (snapshot.exists()) {
                const gameInfo = snapshot.val();

                const fenHistoryRef = ref(realtimeDB, `games/${gameId}/fenHistory`);
                const fenHistorySnapshot = await get(fenHistoryRef);
                const fenHistory = fenHistorySnapshot.exists() ?
                    Object.values(fenHistorySnapshot.val() as Record<string, FenHistoryEntry>).map(entry => entry.newFEN) : [];

                setGameData({ ...gameInfo, fenHistory });
            }
        });

        return () => off(gameRef, 'value', unsubscribe);
    }, [gameId]);

    useEffect(() => {
        if (!gameId) return;

        const currentFENRef = ref(realtimeDB, `games/${gameId}/gameInfo/currentFEN`);
        const onFENChange = onValue(currentFENRef, (snapshot) => {
            if (snapshot.exists()) {
                const fen = snapshot.val();
                setCurrentFEN(fen);
            }
        });

        return () => {
            off(currentFENRef, 'value', onFENChange);
        };
    }, [gameId]);


    useEffect(() => {
        if (!gameData || !gameId) return;

        
        if (["checkmate", "stalemate", "draw"].includes(gameData.gameStatus)) {
            const checkAndSaveGame = async () => {
                if (!gameData || !gameId) return;

                const userGameRef = doc(db, 'users', userId, 'games', gameId);
                const docSnap = await getDoc(userGameRef);

                if (!docSnap.exists()) {
                    addGameToUserCollection(userId, gameId, gameData);

                    if (gameData.players.white !== 'Local' && gameData.players.white !== 'AI' && gameData.players.black !== 'AI' && gameData.players.black !== 'Local' ) {
                        const playerA: Player = { id: userId, elo: await getUserElo(userId) };
                        const playerB: Player = { id: gameData.players.white === userId ? gameData.players.black : gameData.players.white, elo: opponentElo };

                        let gameResult: "A" | "B" | "draw";
                        if (gameData.winner === userId) gameResult = "A";
                        else if (gameData.winner === playerB.id) gameResult = "B";
                        else gameResult = "draw";

                        updateEloRatings(playerA, playerB, gameResult);

                        await Promise.all([
                            updatePlayerElo(userId, playerA.elo)
                        ]);
                    }
                }
                updateEndMessage();
            };




            checkAndSaveGame();
        }
    }, [gameData, gameId, userId]);

    const updateEndMessage = () => {
        if (gameData.gameStatus === "checkmate") {
            setEndMessage(gameData.winner === gameData.players.white ? "White wins!" : "Black wins!");
        } else if (gameData.gameStatus === "stalemate") {
            setEndMessage("It's a Tie!");
        } else if (gameData.gameStatus === "draw") {
            setEndMessage("It's a Draw!");
        }
    };



    useEffect(() => {
        const turn = currentFEN.split(' ')[1];
        const timer = setInterval(() => {
            if (turn === 'w') {
                setTimerWhite(time => time > 0 ? time - 1 : time);
            } else if (turn === 'b') {
                setTimerBlack(time => time > 0 ? time - 1 : time);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [currentFEN]);

    useEffect(() => {
        if ((timerWhite === 0) && (gameId)) {
            handlePlayerLeaving();
        }
        if ((timerBlack === 0) && (gameId)) {
            handlePlayerLeaving();
        }
    }, [timerWhite, timerBlack, gameId, userId]);

    

    const handlePlayerLeaving = async () => {
        if (gameId) {
            await fetchOpponentIdAndUpdateGameStatus(gameId, userId);
            const currentGameRef = ref(realtimeDB, `games/${gameId}/gameInfo`);
            const currentGameState = await get(currentGameRef);
            if (currentGameState.exists()) {
                const gameData = currentGameState.val();

                const fenHistoryRef = ref(realtimeDB, `games/${gameId}/fenHistory`);
                const fenHistorySnapshot = await get(fenHistoryRef);
                const fenHistory = fenHistorySnapshot.exists() ?
                    Object.values(fenHistorySnapshot.val() as Record<string, FenHistoryEntry>).map(entry => entry.newFEN) : [];

                const firestoreGameRef = doc(db, 'games', gameId);
                const updateData = {
                    currentFEN: gameData.currentFEN,
                    fenHistory: fenHistory,
                    gameStatus: gameData.gameStatus,
                    players: gameData.players,
                    ...(gameData.winner && { winner: gameData.winner }) 
                };
                await updateDoc(firestoreGameRef, updateData);

                


                
                await remove(ref(realtimeDB, `games/${gameId}`));
            }
            
        }
    };



    const handleBackToMenu = async () => {
        await handlePlayerLeaving();
        onBackToMenu();
    };

    React.useEffect(() => {
        window.addEventListener('beforeunload', handlePlayerLeaving);

        window.addEventListener('unload', handlePlayerLeaving);

        return () => {
            window.removeEventListener('beforeunload', handlePlayerLeaving);
            window.removeEventListener('unload', handlePlayerLeaving);
        };
    }, [gameId, userId]);

    return (
        <div className="game-page-container">
            <div className="timers">
                <div className="timer timer-white">
                    <span>White Timer: </span>
                    <span>{timerWhite}s</span>
                </div>
                <div className="timer timer-black">
                    <span>Black Timer: </span>
                    <span>{timerBlack}s</span>
                </div>
            </div>
            <div className="board-container">
                <Board propGameId={gameId} propUserId={userId} />
            </div>
            {endMessage && <div className="end-message">{endMessage}</div>}
            <button className="back-to-menu-btn" onClick={handleBackToMenu}>Back to Menu</button>
        </div>
    );
};

export default GamePage;