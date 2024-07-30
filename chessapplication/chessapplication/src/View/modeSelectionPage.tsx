// ModeSelectionPage.tsx
import React from 'react';
import './mainPage.css';

interface ModeSelectionPageProps {
    onModeSelect: (mode: 'multiplayer' | 'singleplayer' | 'AI') => void;
}

const ModeSelectionPage: React.FC<ModeSelectionPageProps> = ({ onModeSelect }) => {

    return (
        <div className="mode-selection-container">
            <div className="mode-card" onClick={() => onModeSelect('multiplayer')}>
                <h3>Multiplayer</h3>
                <p>Play with other players online.</p>
            </div>
            <div className="mode-card" onClick={() => onModeSelect('singleplayer')}>
                <h3>Singleplayer</h3>
                <p>Play locally on your device.</p>
            </div>
            <div className="mode-card" onClick={() => onModeSelect('AI')}>
                <h3>Vs AI</h3>
                <p>Challenge the AI.</p>
            </div>
        </div>
    );
};

export default ModeSelectionPage;
