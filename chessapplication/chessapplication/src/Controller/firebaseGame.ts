// firebaseGame.ts
import { app } from './firebase'; 
import { getFirestore, doc, getDoc, getDocs, deleteDoc, setDoc, collection, query, orderBy, limit, arrayUnion, updateDoc, runTransaction } from 'firebase/firestore';
import { getDatabase, update, push, ref, set, get, remove } from "firebase/database";


const db = getFirestore(app);
const realDB = getDatabase(app);
export const addGameToDatabase = async (gameData: any) => {
    try {
        const gameRef = doc(db, 'games', gameData.id); 
        await setDoc(gameRef, gameData); 
    } catch (error: any) {
        console.error('Error adding game to database:', error);
        throw error; 
    }
};



export const addToWaitingList = async (userId: string, elo: number): Promise<{ gameId: string, opponentElo: number } | null> => {
    try {
        const waitingRoomRef = doc(db, 'waiting_for_game', 'waitingRoom');
        const waitingRoomSnap = await getDoc(waitingRoomRef);

        if (waitingRoomSnap.exists()) {
            const waitingData = waitingRoomSnap.data();
            if (waitingData && waitingData.userId !== userId) {
                const opponentId = waitingData.userId;
                const opponentElo = waitingData.elo; 
                const gameId = await checkOrCreateGame(userId, opponentId);
                await deleteDoc(waitingRoomRef);

                return { gameId, opponentElo };
            } else {
                await setDoc(waitingRoomRef, { userId, elo });
                return null;
            }
        } else {
            await setDoc(waitingRoomRef, { userId, elo });
            return null;
        }
    } catch (error) {
        console.error('Error adding to waiting list:', error);
        throw error;
    }
};

export const removeFromWaitingList = async (userId: string) => {
    try {
        
        const waitingRoomRef = doc(db, 'waiting_for_game', 'waitingRoom');
        const waitingRoomSnap = await getDoc(waitingRoomRef);
        
        
        if (waitingRoomSnap.exists() && waitingRoomSnap.data().userId === userId) {
            await deleteDoc(waitingRoomRef);
        } 
    } catch (error) {
        console.error('Error removing from waiting list:', error);
        throw error;
    }
};























export const checkOrCreateGame = async (playerOneId: string, playerTwoId: string): Promise<string> => {
    try {
        const gameCollectionRef = collection(db, 'games');
        const gameQuery = query(gameCollectionRef, orderBy('id', 'desc'), limit(1));
        const gameSnapshot = await getDocs(gameQuery);
        let newGameId;

        if (!gameSnapshot.empty) {
            const highestId = parseInt(gameSnapshot.docs[0].data().id);
            newGameId = (highestId + 1).toString().padStart(2, '0'); 
        } else {
            newGameId = '01'; 
        }
        const newGame = {
            id: newGameId,
            players: {
                white: playerOneId,
                black: playerTwoId
            },
            currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            fenHistory: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
            gameStatus: 'ongoing'
        };
        await setDoc(doc(db, 'games', newGameId), newGame);
        const gameRef = ref(realDB, 'games/' + newGameId);
        await set(gameRef, {
            gameInfo: {
                players: {
                    white: playerOneId,
                    black: playerTwoId
                },
                gameStatus: 'ongoing',
                currentFEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            },
            boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        });
        return newGameId; 
    } catch (error) {
        console.error('Detailed Error: ', error);
        console.error('Error creating or checking game:', error);
        throw error;
    }
};


/*
export const printAllData = async () => {
    try {
        const querySnapshotUser = await getDocs(collection(db, 'users'));
        querySnapshotUser.forEach((doc) => {
            console.log(doc.id, ' => ', doc.data());
            
        });
        const querySnapshotGames = await getDocs(collection(db, 'games'));
        querySnapshotGames.forEach((doc) => {
            console.log(doc.id, ' => ', doc.data());

        });
    } catch (error) {
        console.log('here error');
        console.error('Error getting documents: ', error);
    }
};
*/

export const updateGameFENHistory = async (gameId: string, newFEN: string) => {
    try {
        const gameRef = doc(db, 'games', gameId);
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) {
                console.error("Document does not exist!");
                throw new Error("Document does not exist!");
            }
            const data = gameDoc.data();

            

            if (data.gameStatus === 'ongoing') {
                transaction.update(gameRef, {
                    currentFEN: newFEN,
                    fenHistory: arrayUnion(newFEN)
                });
                
            } else {
                console.log("updateGameFENHistory function: Game status not 'ongoing' Current status:", data.gameStatus);
            }
        });
    } catch (error) {
        console.error('Error updating game FEN history and status:', error);
        throw error;
    }
};


/*
export const updateGameStatus = async (gameId: string, status: 'checkmate' | 'stalemate' | 'draw' | 'ongoing', winnerId: string) => {
    const gameRef = doc(db, 'games', gameId);

    try {
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) {
                throw new Error("Document does not exist!");
            }

            const data = gameDoc.data();

            // Only update if the game is still ongoing
            if (data.gameStatus === 'ongoing') {
                transaction.update(gameRef, {
                    gameStatus: status,
                    winner: status !== 'ongoing' ? winnerId : null
                });
            }
        });
    } catch (error) {
        console.error('Transaction failed: ', error);
        throw error;
    }
};
*/

export const updateGameStatus = async (gameId: string, status: 'checkmate' | 'stalemate' | 'draw' | 'ongoing', winnerId: string) => {
    const gameRef = doc(db, 'games', gameId);
    try {
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) {
                throw new Error("Document does not exist!");
            }

            const data = gameDoc.data();
            if (data.gameStatus === 'ongoing' && (data.gameStatus !== status || (status !== 'ongoing' && data.winner !== winnerId))) {
                transaction.update(gameRef, {
                    gameStatus: status,
                    winner: status !== 'ongoing' ? winnerId : null
                });
            }
        });
    } catch (error) {
        console.error('Transaction failed: ', error);
        throw error;
    }
};

interface FENHistoryEntry {
    newFEN: string;
}

export const updateGameFENHistoryRealTime = async (gameId: string, newFEN: string) => {
    const db = getDatabase();
    const fenHistoryRef = ref(db, `games/${gameId}/fenHistory`);

    try {
        const snapshot = await get(fenHistoryRef);
        if (snapshot.exists()) {
            const fenHistory = snapshot.val();
            const existingFENs = Object.values(fenHistory as Record<string, FENHistoryEntry>).map(entry => entry.newFEN);

            if (!existingFENs.includes(newFEN)) {
                const newFENRef = push(fenHistoryRef);
                await update(newFENRef, { newFEN });
            } 
        } else {
            const newFENRef = push(fenHistoryRef);
            await update(newFENRef, { newFEN });
        }

        const currentFENRef = ref(db, `games/${gameId}/gameInfo`);
        await update(currentFENRef, { currentFEN: newFEN });

    } catch (error) {
        console.error('Error updating FEN history in Realtime Database:', error);
        throw error;
    }
};



interface GameUpdate {
    gameStatus: 'checkmate' | 'stalemate' | 'draw' | 'ongoing';
    winner?: string;
}

export const updateGameStatusRealTime = async (gameId: string, status: 'checkmate' | 'stalemate' | 'draw' | 'ongoing', winnerId: string = "") => {
    const realDB = getDatabase(); 
    try {
        const gameStatusRef = ref(realDB, `games/${gameId}/gameInfo`);
        const updates: GameUpdate = {
            gameStatus: status
        };

        if (status !== 'ongoing') {
            updates.winner = winnerId; 
        }

        await update(gameStatusRef, updates);
    } catch (error) {
        console.error('Error updating game status in Realtime Database:', error);
        throw error;
    }
};
export const updateCompleteGameState = async (gameId: string, status: 'checkmate' | 'stalemate' | 'draw' | 'ongoing', winnerId: string, currentFEN: string, fenHistory: string[]) => {
    const gameRef = doc(db, 'games', gameId);
    try {
        const updatedFenHistory = fenHistory.includes(currentFEN) ? fenHistory : [...fenHistory, currentFEN];

        await updateDoc(gameRef, {
            currentFEN: currentFEN,
            fenHistory: updatedFenHistory, 
            gameStatus: status,
            winner: winnerId
        });

        const gameRealtimeRef = ref(realDB, `games/${gameId}`);
        await remove(gameRealtimeRef);
    } catch (error) {
        console.error('Error updating complete game state in Firestore:', error);
        throw error;
    }
};


export const fetchOpponentIdAndUpdateGameStatus = async (gameId: string, userId: string) => {
    try {
        const gameRef = doc(db, 'games', gameId);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
            const gameData = gameSnap.data();
            if (gameData.gameStatus === 'ongoing') { 
                const players = gameData.players;
                let opponentId = players.white === userId ? players.black : players.white;

                await updateGameStatusRealTime(gameId, 'checkmate', opponentId);
            }
        } else {
            console.error('Game not found with the provided gameId');
        }
    } catch (error) {
        console.error('Error fetching game data or updating game status:', error);
    }
};

export const fetchCurrentGameStatus = async (gameId: string): Promise<string> => {
    const gameStatusRef = ref(getDatabase(), `games/${gameId}/gameInfo/gameStatus`);
    try {
        const snapshot = await get(gameStatusRef);
        return snapshot.exists() ? snapshot.val() as string : 'unknown';
    } catch (error) {
        console.error('Error fetching game status:', error);
        throw error;
    }
};


export const getCurrentBoardFEN = async (gameId: string): Promise<string> => {
    const realdb = getDatabase();
    const fenRef = ref(realdb, `games/${gameId}/gameInfo/currentFEN`);
    try {
        const snapshot = await get(fenRef);
        return snapshot.exists() ? snapshot.val() as string : "";
    } catch (error) {
        console.error('Error fetching current FEN:', error);
        throw error;
    }
};


export const addGameToUserCollection = async (userId: string, gameId: string, gameData: any) => {
    try {
        const userGameRef = doc(db, 'users', userId, 'games', gameId); 
        await setDoc(userGameRef, gameData);
        //console.log(`Game added to ${userId}'s collection successfully.`);
    } catch (error) {
        console.error("Failed to add game to user's collection:", error);
    }
};










