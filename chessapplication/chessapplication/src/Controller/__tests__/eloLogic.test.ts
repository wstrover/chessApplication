import { calculateExpectedScore, calculateEloChange, Player } from '../eloLogic';

describe('Elo Logic', () => {
    const playerA: Player = { id: 'A', elo: 1600 };
    const playerB: Player = { id: 'B', elo: 1400 };
    const K = 32;

    it('should calculate expected scores correctly', () => {
        const [expectedScoreA, expectedScoreB] = calculateExpectedScore(playerA, playerB);
        expect(expectedScoreA).toBeCloseTo(0.76, 2);
        expect(expectedScoreB).toBeCloseTo(0.24, 2);
    });

    it('should calculate elo change correctly for player A win', () => {
        const [eloChangeA, eloChangeB] = calculateEloChange(playerA, playerB, 'A');
        expect(eloChangeA).toBeGreaterThan(0);
        expect(eloChangeB).toBeLessThan(0);
    });

    it('should calculate elo change correctly for a draw', () => {
        const [eloChangeA, eloChangeB] = calculateEloChange(playerA, playerB, 'draw');
        const expectedEloChangeA = 32 * (0.5 - 0.76);
        const expectedEloChangeB = 32 * (0.5 - 0.24);
        expect(eloChangeA).toBeCloseTo(expectedEloChangeA, 1);
        expect(eloChangeB).toBeCloseTo(expectedEloChangeB, 1);
    });
});
