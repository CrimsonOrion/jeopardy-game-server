/*
 * Serve JSON to our AngularJS client
 */

var _ = require('lodash');

var RESOURCE_SERVER = process.env.RESOURCE_SERVER || 'localhost:3001';

/**
 * Fetch and forward the raw API response from our own Jeopardy! Question Server here.
 * See https://github.com/andygrunwald/jeopardy-game-server for more.
 */
async function fetchAndForward (url, res, next) {
    try {
        const response = await fetch(url);
        const body = await response.text();
        res.type('json');
        res.send(body);
    } catch (error) {
        next(error);
    }
}

// Get Seasons list
exports.seasons = function (req, res, next) {
    fetchAndForward('http://' + RESOURCE_SERVER + '/game-content/seasons', res, next);
}

// Get Season
exports.season = function (req, res, next) {
    fetchAndForward('http://' + RESOURCE_SERVER + '/game-content/seasons/' + req.params.id, res, next);
}

// Get Game
exports.game = function (req, res, next) {
    fetchAndForward('http://' + RESOURCE_SERVER + '/game-content/games/' + req.params.id, res, next);
}