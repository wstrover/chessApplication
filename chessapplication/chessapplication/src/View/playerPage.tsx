import React, { useEffect, useState } from 'react';
import { getUserName, getUserElo, getUserPastGames } from '../Controller/firebaseUser';
import ReviewBoard from '../Model/reviewBoard';
import './mainPage.css';

interface PlayerPageProps {
    userId: string;
}

export interface GameInfo {
    gameId: string;
    status: string;
    opponent: string;
    result: string;
    gameType: string;
}

const PlayerPage: React.FC<PlayerPageProps> = ({ userId }) => {
    const [userName, setUserName] = useState<string | null>(null);
    const [userElo, setUserElo] = useState<number | null>(null);
    const [pastGames, setPastGames] = useState<GameInfo[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const name = await getUserName(userId);
            const elo = await getUserElo(userId);
            setUserName(name);
            setUserElo(elo);

            const games = await getUserPastGames(userId);
            setPastGames(games);
        };

        fetchUserData();
    }, [userId]);

    return (
        <div className="player-page-container">
            {selectedGame ? (
                <ReviewBoard
                    gameId={selectedGame.gameId}
                    userId={userId}
                    onBack={() => setSelectedGame(null)}
                />
            ) : (
                <>
                    <h2>{userName ?? 'Loading...'}</h2>
                    <p>Elo: {userElo ?? 'Loading...'}</p>
                    <h3>Past Games:</h3>
                    {selectedGame == null && pastGames.length > 0 ? (
                        <ul>
                            {pastGames.map(game => (
                                <li key={game.gameId}>
                                    ID: {game.gameId}, Type: {game.gameType}, Status: {game.status}, Result: {game.result}
                                    <button className="review-button" onClick={() => setSelectedGame(game)}>Review Game</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No past games to show.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default PlayerPage;
