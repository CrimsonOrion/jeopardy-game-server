jest.mock('jsonfile');

const jsonfile = require('jsonfile');
const createSocketHandler = require('../routes/socket');

function mockIo() {
    return { emit: jest.fn() };
}

function mockSocket() {
    const handlers = {};
    return {
        on: jest.fn((event, cb) => { handlers[event] = cb; }),
        emit: jest.fn(),
        broadcast: { emit: jest.fn() },
        trigger: (event, data) => handlers[event](data),
    };
}

function connect(io) {
    const socket = mockSocket();
    createSocketHandler(io)(socket);
    return socket;
}

describe('routes/socket', () => {
    beforeEach(() => {
        jsonfile.writeFileSync.mockClear();
    });

    test('game:start stores the game, sets round to J, and broadcasts round:start', () => {
        const io = mockIo();
        const socket = connect(io);
        const data = { data: { id: 'game-1' }, game: {} };

        socket.trigger('game:start', data);

        expect(data.game.round).toBe('J');
        expect(io.emit).toHaveBeenCalledWith('round:start', data);
    });

    test('round:end from J advances to DJ and hands control to the lowest scorer', () => {
        const io = mockIo();
        const socket = connect(io);
        socket.trigger('game:start', { data: { id: 'game-2' }, game: {} });

        socket.trigger('round:end', {
            round: 'J',
            player_1: { score: 500 },
            player_2: { score: 100 },
            player_3: { score: 300 },
        });

        const broadcast = io.emit.mock.calls.find((call) => call[0] === 'round:start');
        const updated = broadcast[1].game;

        expect(updated.round).toBe('DJ');
        expect(updated.control_player).toBe('player_2');
    });

    test('round:end from DJ advances to FJ and clears control_player', () => {
        const io = mockIo();
        const socket = connect(io);
        socket.trigger('game:start', { data: { id: 'game-3' }, game: {} });

        socket.trigger('round:end', { round: 'DJ' });

        const broadcast = io.emit.mock.calls.find((call) => call[0] === 'round:start');
        const updated = broadcast[1].game;

        expect(updated.round).toBe('FJ');
        expect(updated.control_player).toBeUndefined();
    });

    test('round:end from FJ ends the game and writes the result to disk', () => {
        const io = mockIo();
        const socket = connect(io);
        socket.trigger('game:start', { data: { id: 'game-4' }, game: {} });

        socket.trigger('round:end', { round: 'FJ' });

        const broadcast = io.emit.mock.calls.find((call) => call[0] === 'round:start');
        expect(broadcast[1].game.round).toBe('end');

        expect(jsonfile.writeFileSync).toHaveBeenCalledTimes(1);
        const [filePath, written, options] = jsonfile.writeFileSync.mock.calls[0];
        expect(filePath).toMatch(/^games\/game-4-\d+\.json$/);
        expect(written.round).toBe('end');
        expect(options).toEqual({ spaces: 2 });
    });

    test('board:init replies with the stored game for the current id', () => {
        const io = mockIo();
        const socket = connect(io);
        const data = { data: { id: 'game-5' }, game: { foo: 'bar' } };
        socket.trigger('game:start', data);

        socket.trigger('board:init');

        expect(socket.emit).toHaveBeenCalledWith('board:init', data);
    });

    test('game:init replies with the stored game for the requested id', () => {
        const io = mockIo();
        const socket = connect(io);
        const data = { data: { id: 'game-6' }, game: {} };
        socket.trigger('game:start', data);

        socket.trigger('game:init', 'game-6');

        expect(socket.emit).toHaveBeenCalledWith('game:init', data);
    });

    test('clue:start broadcasts the clue to everyone else', () => {
        const io = mockIo();
        const socket = connect(io);

        socket.trigger('clue:start', { clue: 'clue_J_1_1' });

        expect(socket.broadcast.emit).toHaveBeenCalledWith('clue:start', { clue: 'clue_J_1_1' });
    });

    test('clue:daily broadcasts to everyone else', () => {
        const io = mockIo();
        const socket = connect(io);

        socket.trigger('clue:daily', { clue: 'clue_DJ_2_4' });

        expect(socket.broadcast.emit).toHaveBeenCalledWith('clue:daily', { clue: 'clue_DJ_2_4' });
    });

    test('clue:end updates the stored game and broadcasts to everyone else', () => {
        const io = mockIo();
        const socket = connect(io);
        socket.trigger('game:start', { data: { id: 'game-7' }, game: {} });

        socket.trigger('clue:end', { round: 'J', clue_J_1_1: true });

        expect(socket.broadcast.emit).toHaveBeenCalledWith('clue:end', { round: 'J', clue_J_1_1: true });

        socket.trigger('board:init');
        expect(socket.emit).toHaveBeenCalledWith(
            'board:init',
            expect.objectContaining({ game: { round: 'J', clue_J_1_1: true } })
        );
    });
});
