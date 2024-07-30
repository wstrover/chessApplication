// MainPage.tsx
import React, { useState, useEffect } from 'react';
import './mainPage.css';
import { signOut } from '../Controller/firebaseAuth';
import { addToWaitingList, checkOrCreateGame, removeFromWaitingList } from '../Controller/firebaseGame';
import { getUserElo } from '../Controller/firebaseUser';
import ModeSelectionPage from './modeSelectionPage';
import WaitingForGamePage from './waitingForGame';
import GamePage from './gamePage'; 
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../Controller/firebase';
import PlayerPage from './playerPage';

interface MainPageProps {
    userId: string;
}

const MainPage: React.FC<MainPageProps> = ({ userId }) => {
    const [mode, setMode] = useState<'multiplayer' | 'singleplayer' | 'AI' | null>(null);
    const [waitingForGame, setWaitingForGame] = useState<boolean>(false);
    const [gameId, setGameId] = useState<string | null>(null);
    const [opponentElo, setOpponentElo] = useState<number>(0);

    const [activeTab, setActiveTab] = useState<'Play' | 'Player' | 'Settings'>('Play');

    const switchTab = (tabName: 'Play' | 'Player' | 'Settings') => {
        setActiveTab(tabName);
    };

    useEffect(() => {
        const handleWindowClose = async () => {
            if (mode === 'multiplayer') {
                await removeFromWaitingList(userId);
            }
        };

        window.addEventListener('unload', handleWindowClose);
        return () => {
            window.removeEventListener('unload', handleWindowClose);
            if (mode === 'multiplayer') {
                removeFromWaitingList(userId);
            }
        };
    }, [userId, mode]);

    useEffect(() => {
        let unsubscribeWhite = () => { };
        let unsubscribeBlack = () => { };

        if (waitingForGame) {
            console.log(gameId);
            const gamesRefWhite = query(collection(db, 'games'), where("players.white", "==", userId));
            unsubscribeWhite = onSnapshot(gamesRefWhite, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {
                    if ((change.type === "added" || change.type === "modified") && change.doc.data().gameStatus === 'ongoing') {
                        setGameId(change.doc.id);
                        setMode('multiplayer'); 
                        setWaitingForGame(false);
                    }
                });
            });

            const gamesRefBlack = query(collection(db, 'games'), where("players.black", "==", userId));
            unsubscribeBlack = onSnapshot(gamesRefBlack, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {
                    if ((change.type === "added" || change.type === "modified") && change.doc.data().gameStatus === 'ongoing') {
                        setGameId(change.doc.id);
                        setMode('multiplayer');
                        setWaitingForGame(false);
                    }
                });
            });
        }

        return () => {
            unsubscribeWhite();
            unsubscribeBlack();
        };
    }, [userId, waitingForGame]);

    const handleModeSelect = async (selectedMode: 'multiplayer' | 'singleplayer' | 'AI') => {
        setGameId(null);
        setMode(selectedMode);
        
        if (selectedMode === 'multiplayer') {
            setWaitingForGame(true);
            const userElo = await getUserElo(userId);

            const gameResponse = await addToWaitingList(userId, userElo);
            if (gameResponse) {
                const { gameId, opponentElo } = gameResponse;

                setGameId(gameId);
                setOpponentElo(opponentElo); 
                setWaitingForGame(false);
            } else {
                setWaitingForGame(true);
            }
        } else {
            console.log(selectedMode);
            console.log(userId);
            const secondPlayerId = selectedMode === 'singleplayer' ? 'Local' : 'AI';
            const newGameId = await checkOrCreateGame(userId, secondPlayerId);
            console.log(newGameId);
            setGameId(newGameId);
            setWaitingForGame(false);
        }
    };

    const handleBack = async () => {
        if (mode === 'multiplayer') {
            await removeFromWaitingList(userId); 
        }
        setMode(null);
        setGameId(null);
        setWaitingForGame(false);
    };

    const handleSignOut = async () => {
        if (mode === 'multiplayer') {
            await removeFromWaitingList(userId);
        }
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
        setGameId(null);
        setMode(null);
    };

    const handlePrintGameId = () => {
        console.log("Current gameId:", gameId);
    };
    return (
        <div className="main-page-container">
            <header className="header">
                <h1>Chess</h1>
                <div className="right-section">
                    <button className="settings-btn">Settings</button>
                    <button onClick={handleSignOut}>Sign Out</button>
                </div>
            </header>
            <nav className="tabs">
                <button className={activeTab === 'Play' ? 'active' : ''} onClick={() => switchTab('Play')}>Play</button>
                <button className={activeTab === 'Player' ? 'active' : ''} onClick={() => switchTab('Player')}>Player</button>
            </nav>
            <main className="content">
                {activeTab === 'Play' && !gameId && !waitingForGame && (
                    <ModeSelectionPage onModeSelect={handleModeSelect} />
                )}
                {activeTab === 'Player' && (
                    <PlayerPage userId={userId} />
                )}
                {gameId && activeTab === 'Play' && (
                    <GamePage gameId={gameId} userId={userId} opponentElo={opponentElo} onBackToMenu={handleBack} />
                )}
                {waitingForGame && activeTab === 'Play' && (
                    <WaitingForGamePage onBack={handleBack} />
                )}
            </main>
        </div>
    );
};

export default MainPage;
