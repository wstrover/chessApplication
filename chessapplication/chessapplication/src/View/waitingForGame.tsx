// WaitingForGamePage.tsx
import React from 'react';
import './mainPage.css';

interface WaitingForGamePageProps {
    onBack: () => void;
}

const WaitingForGamePage: React.FC<WaitingForGamePageProps> = ({ onBack }) => {
    return (
        <div className="waiting-for-game">
            <p>Waiting for opponent...</p>
            <button className="back-button" onClick={onBack}>Back</button>
        </div>
    );
};

export default WaitingForGamePage;
