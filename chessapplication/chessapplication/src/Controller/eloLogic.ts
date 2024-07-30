// eloLogic.ts

export interface Player {
    id: string;
    elo: number;
}

const K = 32; 

export function calculateExpectedScore(playerA: Player, playerB: Player): [number, number] {
    const Qa = Math.pow(10, playerA.elo / 400);
    const Qb = Math.pow(10, playerB.elo / 400);
    const expectedScoreA = Qa / (Qa + Qb);
    const expectedScoreB = Qb / (Qa + Qb);

    return [expectedScoreA, expectedScoreB];
}

export function calculateEloChange(playerA: Player, playerB: Player, result: "A" | "B" | "draw"): [number, number] {
    const [expectedScoreA, expectedScoreB] = calculateExpectedScore(playerA, playerB);

    let scoreA, scoreB;

    switch (result) {
        case "A":
            scoreA = 1;
            scoreB = 0;
            break;
        case "B":
            scoreA = 0;
            scoreB = 1;
            break;
        case "draw":
            scoreA = 0.5;
            scoreB = 0.5;
            break;
        default:
            throw new Error("Invalid game result");
    }

    const eloChangeA = K * (scoreA - expectedScoreA);
    const eloChangeB = K * (scoreB - expectedScoreB);

    return [eloChangeA, eloChangeB];
}

export function updateEloRatings(playerA: Player, playerB: Player, result: "A" | "B" | "draw"): void {
    const [eloChangeA, eloChangeB] = calculateEloChange(playerA, playerB, result);

    playerA.elo += eloChangeA;
    playerB.elo += eloChangeB;
}

