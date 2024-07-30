import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Board from '../Board';

describe('Board Component', () => {
    const mockGameId = 'test-game';
    const mockUserId = 'test-user';

    it('renders chessboard correctly', () => {
        render(<Board propGameId={mockGameId} propUserId={mockUserId} />);
        const squares = screen.getAllByRole('button');
        expect(squares).toHaveLength(64);
    });

    it('allows piece movement', () => {
        render(<Board propGameId={mockGameId} propUserId={mockUserId} />);
        const firstSquare = screen.getByTestId('square-0-6');
        const targetSquare = screen.getByTestId('square-0-4');
        fireEvent.click(firstSquare);
        fireEvent.click(targetSquare);
        expect(firstSquare).toBeEmptyDOMElement();
        expect(targetSquare).toContainElement(screen.getByRole('img'));
    });

    it('toggles voice recognition button', () => {
        render(<Board propGameId={mockGameId} propUserId={mockUserId} />);
        const button = screen.getByText('Start Voice Recognition');
        fireEvent.click(button);
        expect(button).toHaveTextContent('Stop Voice Recognition');
    });
});
