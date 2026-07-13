function mockFetchResolving(body) {
    global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve(body)
    });
}

function mockRes() {
    return { type: jest.fn(), send: jest.fn() };
}

describe('routes/api', () => {
    const originalResourceServer = process.env.RESOURCE_SERVER;

    afterEach(() => {
        jest.resetModules();
        process.env.RESOURCE_SERVER = originalResourceServer;
    });

    test('seasons fetches from RESOURCE_SERVER and forwards the body as json', async () => {
        process.env.RESOURCE_SERVER = 'localhost:3001';
        mockFetchResolving('[{"id":"final-fantasy"}]');
        const api = require('../routes/api');
        const res = mockRes();

        await api.seasons({}, res, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons');
        expect(res.type).toHaveBeenCalledWith('json');
        expect(res.send).toHaveBeenCalledWith('[{"id":"final-fantasy"}]');
    });

    test('season fetches the given season id from RESOURCE_SERVER', async () => {
        process.env.RESOURCE_SERVER = 'localhost:3001';
        mockFetchResolving('[]');
        const api = require('../routes/api');
        const res = mockRes();

        await api.season({ params: { id: 'final-fantasy' } }, res, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons/final-fantasy');
    });

    test('game fetches the given game id from RESOURCE_SERVER', async () => {
        process.env.RESOURCE_SERVER = 'localhost:3001';
        mockFetchResolving('{}');
        const api = require('../routes/api');
        const res = mockRes();

        await api.game({ params: { id: 'final-fantasy---final-fantasy-game-1' } }, res, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/game-content/games/final-fantasy---final-fantasy-game-1'
        );
    });

    test('falls back to localhost:3001 when RESOURCE_SERVER is unset', async () => {
        delete process.env.RESOURCE_SERVER;
        mockFetchResolving('[]');
        const api = require('../routes/api');
        const res = mockRes();

        await api.seasons({}, res, jest.fn());

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons');
    });

    test('passes fetch errors to next instead of throwing', async () => {
        process.env.RESOURCE_SERVER = 'localhost:3001';
        global.fetch = jest.fn().mockRejectedValue(new Error('upstream unreachable'));
        const api = require('../routes/api');
        const res = mockRes();
        const next = jest.fn();

        await api.seasons({}, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(res.send).not.toHaveBeenCalled();
    });
});
