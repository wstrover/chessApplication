// App.tsx
import React, { useState, useEffect } from 'react';
import { app } from './Controller/firebase';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import './App.css';
import LoginPage from './View/loginPage';
import MainPage from './View/mainPage';

function App() {
    const [user, setUser] = useState<User | null>(null); // Used to keep user data

    useEffect(() => {
        const auth = getAuth(app);
        // checks for when the state of authorization changes
        const logOut = onAuthStateChanged(auth, async (user) => {
            if (user) {
                //if the user was already signed in sets it to null
                setUser(user);
            } else {
                // if there was no user signs them in
                setUser(null);
            }
        });

        return () => logOut();
    }, []);

    if (user) {
        return (
            <MainPage userId={user.uid} /> 
        )
    } else {
        return (
            <LoginPage />
        );
    }
}

export default App;
