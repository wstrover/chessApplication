// firebaseAuth.ts
import { app } from './firebase';
import { getAuth, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';


const auth: Auth = getAuth(app);
const db = getFirestore(app);

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password); 
        const user = userCredential.user; 
        return user;

    } catch (error: any) { 
        //const errorCode = error.code;
        //const errorMessage = error.message;
        //console.error(`Sign In Error (${errorCode}): ${errorMessage}`);
        throw error;
    }
};

export const register = async (email: string, password: string, displayName: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;


        await updateProfile(user, { displayName });

        console.log(email);
        console.log(displayName);
        console.log(user.uid);
        console.log(user);
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            uid: user.uid,
            elo: 1500
        });

        await auth.signOut();

        return user;
    } catch (error: any) { 
        //const errorCode = error.code;
        //const errorMessage = error.message;
        //console.error(`Registration Error (${errorCode}): ${errorMessage}`);
        throw error;
    }
};

export const signOut = () => auth.signOut(); 
