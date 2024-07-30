// stockfishServer.js
const { spawn } = require('child_process');
const express = require('express');
const path = require('path');
const app = express();
const port = 5050;


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

let stockfish;

app.use(express.json());

app.post('/stockfish/start', (req, res) => {
    const stockfishPath = path.resolve(__dirname, '../../public/stockfish/stockfish-windows-x86-64.exe');
    console.log(`Starting Stockfish at: ${stockfishPath}`);

    stockfish = spawn(stockfishPath);

    stockfish.stdout.on('data', (data) => {
        console.log(`Stockfish: ${data}`);
    });

    stockfish.stderr.on('data', (data) => {
        console.error(`Stockfish error: ${data}`);
    });

    stockfish.on('close', (code) => {
        console.log(`Stockfish process exited with code ${code}`);
    });

    res.send('Stockfish started');
});

app.post('/stockfish/move', (req, res) => {
    const { fen } = req.body;
    console.log("Received FEN:", fen);
    if (stockfish) {
        stockfish.stdin.write(`position fen ${fen}\ngo depth 20\n`);

        let response = '';
        const timeout = setTimeout(() => {
            stockfish.stdout.removeListener('data', onData);
            console.error("Stockfish move request timed out.");
            res.status(500).send('Failed to get best move in time');
        }, 10000);

        function onData(data) {
            response += data.toString();
            const bestMoveMatch = response.match(/bestmove\s(\S+)/);
            if (bestMoveMatch) {
                clearTimeout(timeout);
                stockfish.stdout.removeListener('data', onData);
                console.log("Best move found:", bestMoveMatch[1]);
                res.send(bestMoveMatch[1]);
            } else {
                console.log("Partial response:", response);
            }
        }

        stockfish.stdout.on('data', onData);
    } else {
        console.error('Stockfish not started');
        res.status(500).send('Stockfish not started');
    }
});

app.post('/stockfish/stop', (req, res) => {
    if (stockfish) {
        stockfish.stdin.end();
        res.send('Stockfish stopped');
    } else {
        res.status(500).send('Stockfish not started');
    }
});

app.listen(port, () => {
    console.log(`Stockfish server listening at http://localhost:${port}`);
});
