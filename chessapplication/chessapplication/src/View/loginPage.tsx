// LoginPage.tsx
import React, { useState } from 'react';
import './loginPage.css';
import { signIn, register } from '../Controller/firebaseAuth';

const LoginPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<string>('login');

    const tryLogin = async () => {
        try {
            await signIn(email, password);
            setError(null);
        } catch (error) {
            setError('Incorrect Email or Password');
        }
    };

    const tryRegister = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (name.trim() === '') {
            setError('Please enter your name');
            return;
        }
        if (email.trim() === '') {
            setError('Please enter an email');
            return;
        }
        if (password === '') {
            setError('Please enter a password');
            return;
        }
        try {
            await register(email, password, name);
            setError(null);
        } catch (error: any) {
            setError(error.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="full-page-container">
            <div className="image-container">
                {/* Optional: Add an image or logo here */}
            </div>
            <div className="login-container">
                <h1>Chess Online</h1>
                {page === 'register' && (
                    <div className="input-container">
                        <label>Name:</label>
                        <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                )}
                <div className="input-container">
                    <label>Email:</label>
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="input-container">
                    <label>Password:</label>
                    <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {page === 'register' && (
                    <div className="input-container">
                        <label>Confirm Password:</label>
                        <input type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                )}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="button-container">
                    {page === 'login' ? (
                        <>
                            <button style={{ backgroundColor: '#3498db', color: '#ffffff' }} onClick={tryLogin}>Login</button> 
                            <button style={{ backgroundColor: '#3498db', color: '#ffffff' }} onClick={() => setPage('register')}>Register</button> 
                        </>
                    ) : (
                        <>
                            <button style={{ backgroundColor: '#3498db', color: '#ffffff' }} onClick={tryRegister}>Register</button> 
                            <button style={{ backgroundColor: '#3498db', color: '#ffffff' }} onClick={() => setPage('login')}>Back</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
