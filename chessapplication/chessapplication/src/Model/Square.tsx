// Square.tsx
import React from 'react';
import './Square.css';

const Square: React.FC<{
    piece: any;
    x: number;
    y: number;
    onSquareClick?: () => void;
    isDark: boolean;
    isActive: boolean;
    isHighlighted: boolean;
}> = ({ piece, x, y, onSquareClick, isActive, isHighlighted, isDark }) => {
    const squareClass = `chess-square ${isDark ? 'dark' : ''} ${isActive ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''}`;
    return (
        <div className={squareClass} onClick={onSquareClick}>
            {piece && <img src={piece.imageUrl} alt={piece.type} />}
        </div>
    );
};

export default Square;
