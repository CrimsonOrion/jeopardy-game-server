/*
 * Serve JSON to our AngularJS client
 */

//const got = require('got');
var request = require('request');
var _ = require('lodash');

process.env.RESOURCE_SERVER = 'jeopardyserver.crimsonorion.com';

/**
 * Export the raw API response from our own Jeopardy! Question Server here.
 * See https://github.com/andygrunwald/jeopardy-game-server for more.
 */
function exportRawAPIResponse (req, res, next) {
    return function (error, response, body) {
        if (!error) {
            res.type('json');
            res.send(body);
        } else {
            next(error);
        }
    };
}

// Get Seasons list
exports.seasons = function (req, res, next) {
    request('https://' + process.env.RESOURCE_SERVER + '/game-content/seasons', exportRawAPIResponse(req, res, next));
    // try {
    //     const response = await got('http://' + process.env.RESOURCE_SERVER + '/game-content/seasons', exportRawAPIResponse(req, res, next));
    // } catch (error) {
    //     console.log('error:', error);
    // }
}

// Get Season
exports.season = function (req, res, next) {
    request('https://' + process.env.RESOURCE_SERVER + '/game-content/seasons/' + req.params.id, exportRawAPIResponse(req, res, next));
    // try {
    //     const response = await got('http://' + process.env.RESOURCE_SERVER + '/game-content/seasons/' + req.params.id, exportRawAPIResponse(req, res, next));
    // } catch (error) {
    //     console.log('error:', error);
    // }
}

// Get Game
exports.game = function (req, res, next) {
    request('https://' + process.env.RESOURCE_SERVER + '/game-content/games/' + req.params.id, exportRawAPIResponse(req, res, next));
    // try {
    //     const response = await got('http://' + process.env.RESOURCE_SERVER + '/game-content/games/' + req.params.id, exportRawAPIResponse(req, res, next));
    // } catch (error) {
    //     console.log('error:', error);
    // }
}