const routes = require('../routes/index');

function mockRes() {
    return { render: jest.fn() };
}

describe('routes/index', () => {
    test('index renders the index view', () => {
        const res = mockRes();

        routes.index({}, res);

        expect(res.render).toHaveBeenCalledWith('index');
    });

    test('partials renders the requested partial by name', () => {
        const res = mockRes();

        routes.partials({ params: { name: 'board' } }, res);

        expect(res.render).toHaveBeenCalledWith('partials/board');
    });
});
