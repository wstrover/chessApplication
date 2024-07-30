// ReviewBoard.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { notationLogic } from './notationLogic';
import './reviewBoard.css'; 
import { db } from '../Controller/firebase';
import Square from './Square';  

interface ReviewBoardProps {
    gameId: string;
    userId: string;
    onBack: () => void;
}

const ReviewBoard: React.FC<ReviewBoardProps> = ({ gameId, userId, onBack }) => {
    const [fenHistory, setFenHistory] = useState<string[]>([]);
    const [currentMove, setCurrentMove] = useState<number>(0);
    const [currentFEN, setCurrentFEN] = useState<string>("");

    useEffect(() => {
        const fetchGame = async () => {
            const gameDocRef = doc(db, 'games', gameId);
            const gameDoc = await getDoc(gameDocRef);

            if (gameDoc.exists()) {
                const gameData = gameDoc.data();
                if (gameData && Array.isArray(gameData.fenHistory)) {
                    setFenHistory(gameData.fenHistory);
                    setCurrentFEN(gameData.fenHistory[0] || "");
                }
            }
        };

        fetchGame();
    }, [gameId]);

    const handleNext = () => {
        if (currentMove < fenHistory.length - 1) {
            const newMove = currentMove + 1;
            setCurrentMove(newMove);
            setCurrentFEN(fenHistory[newMove]);
        }
    };

    const handlePrevious = () => {
        if (currentMove > 0) {
            const newMove = currentMove - 1;
            setCurrentMove(newMove);
            setCurrentFEN(fenHistory[newMove]);
        }
    };

    const board = notationLogic.fenToBoard(currentFEN);

    return (
        <div className="review-board-container">
            <div className="board-grid">
                <div className="label-row">
                    <div className="label-placeholder" />
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, idx) => (
                        <div key={idx} className="file-label">{file}</div>
                    ))}
                    <div className="label-placeholder" />
                </div>

                {board ? board.map((row, index) => (
                    <div key={`row-${index}`} className="board-row">
                        <div className="rank-label">{8 - index}</div>
                        {row.map((piece, x) => {
                            const isDark = (x + index) % 2 === 1;
                            return (
                                <Square
                                    key={`square-${x}-${index}`}
                                    piece={piece}
                                    x={x}
                                    y={index}
                                    isDark={isDark}
                                    isActive={false}
                                    isHighlighted={false}
                                />
                            );
                        })}
                        <div className="rank-label">{8 - index}</div>
                    </div>
                )) : <div>Loading board...</div>}

                <div className="label-row">
                    <div className="label-placeholder" />
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, idx) => (
                        <div key={idx} className="file-label">{file}</div>
                    ))}
                    <div className="label-placeholder" />
                </div>
            </div>
            <div className="controls">
                <button onClick={handlePrevious} disabled={currentMove <= 0}>Previous</button>
                <button onClick={handleNext} disabled={currentMove >= fenHistory.length - 1}>Next</button>
                <button onClick={onBack}>Back</button>
            </div>
        </div>
    );

}

export default ReviewBoard;
