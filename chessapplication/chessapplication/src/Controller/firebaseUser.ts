// firebaseUser.ts
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { app } from './firebase';
import { GameInfo } from '../View/playerPage';

const db = getFirestore(app);

export const getUserElo = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData?.elo || 0; 
        } else {
            console.log('No elo document');
            return 0; 
        }
    } catch (error) {
        console.error('Error getting user Elo:', error);
        throw error;
    }
};


export const updatePlayerElo = async (userId: string, newElo: number) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { elo: newElo });
    } catch (error) {
        console.error('Error updating player ELO:', error);
        throw error;
    }
};

export const getUserName = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData?.displayName || null;
        } else {
            console.log('No Username document');
            return null; 
        }
    } catch (error) {
        console.error('Error getting user displayName:', error);
        throw error;
    }
};


export const getUserUID = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return userData?.uid || null; 
        } else {
            console.log('No UserID document');
            return null; 
        }
    } catch (error) {
        console.error('Error getting user uid:', error);
        throw error;
    }
};

export const getUserPastGames = async (userId: string): Promise<GameInfo[]> => {
    try {
        const gamesRef = collection(db, 'users', userId, 'games');
        const gamesSnapshot = await getDocs(gamesRef);

        if (!gamesSnapshot.empty) {
            const games = gamesSnapshot.docs.map(doc => {
                const data = doc.data();

                const isLocalGame = data.players.black === "Local" || data.players.white === "Local";
                const isAIGame = data.players.black === "AI" || data.players.white === "AI";
                const gameType = isLocalGame
                    ? "Local"
                    : isAIGame
                        ? "AI"
                        : "Multiplayer";

                const winner = data.winner || "unknown";
                const outcome = winner === "Local"
                    ? "Black Wins"
                    : winner !== "unknown" && winner !== "Local"
                        ? "White Wins"
                        : "N/A";

                return {
                    gameId: doc.id,
                    gameType,
                    status: data.gameStatus || "unknown",
                    opponent: data.players.black === "Local" ? data.players.white : "Local",
                    winner: outcome,
                    result: outcome  
                };
            });

            

            return games;
        } else {
            console.log("No past games found");
            return [];
        }
    } catch (error) {
        console.error("Error getting user past games:", error);
        throw error;
    }
};

