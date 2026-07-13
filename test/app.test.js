process.env.AUTH_USER = 'test-user';
process.env.AUTH_PASS = 'test-pass';
process.env.RESOURCE_SERVER = 'localhost:3001';

const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
    test('renders the index page', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.text).toContain('ng-app="myApp"');
    });
});

describe('GET /partials/:name', () => {
    test('renders the requested partial', async () => {
        const response = await request(app).get('/partials/board');

        expect(response.status).toBe(200);
        expect(response.text).toContain('jeopardy-board');
    });
});

describe('GET /api/*', () => {
    test('rejects requests without credentials', async () => {
        const response = await request(app).get('/api/seasons');

        expect(response.status).toBe(401);
    });

    test('rejects requests with the wrong credentials', async () => {
        const response = await request(app)
            .get('/api/seasons')
            .auth('wrong-user', 'wrong-pass');

        expect(response.status).toBe(401);
    });

    test('proxies to RESOURCE_SERVER with the right credentials', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('[{"id":"final-fantasy"}]')
        });

        const response = await request(app)
            .get('/api/seasons')
            .auth('test-user', 'test-pass');

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/game-content/seasons');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id: 'final-fantasy' }]);
    });
});
