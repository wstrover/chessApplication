// stockfishLogic.ts

import axios from 'axios';

export const initializeEngine = async (): Promise<void> => {
    try {
        await axios.post('http://localhost:5050/stockfish/start');
    } catch (error) {
        console.error('Error initializing Stockfish:', error);
    }
};


export const sendMove = async (fen: string): Promise<string> => {
    try {
        const url = 'http://localhost:5050/stockfish/move';
        const headers = { 'Content-Type': 'application/json' };
        const data = { fen };

        //console.log("Sending request to:", url);
        //console.log("Request headers:", headers);
        //console.log("Request body:", JSON.stringify(data));

        const response = await axios.post(url, data, { headers, timeout: 10000 });

        console.log("Received response from server:", response.data);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.error('Error response from server:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};


export const terminateEngine = async (): Promise<void> => {
    try {
        await axios.post('http://localhost:5050/stockfish/stop');
    } catch (error) {
        console.error('Error terminating Stockfish:', error);
    }
};
