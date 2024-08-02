import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';

import App from './App';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    onAuthStateChanged: jest.fn(),
}));

jest.mock('./View/loginPage', () => () => <div>Login Page</div>);
jest.mock('./View/mainPage', () => ({ userId }: { userId: string }) => <div>Main Page with userId: {userId}</div>);

describe('App', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login page when no user is signed in', async () => {
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn();
        });

        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument();
        });
    });

    it('renders main page when a user is signed in', async () => {
        (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
            callback({ uid: 'test-uid' });
            return jest.fn();
        });

        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(screen.getByText('Main Page with userId: test-uid')).toBeInTheDocument();
        });
    });
});
