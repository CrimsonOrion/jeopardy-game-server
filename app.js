require('dotenv').config({ quiet: true });

/*
    Module Dependencies
*/

var express = require('express'),
    routes = require('./routes'),
    api = require('./routes/api'),
    http = require('http'),
    path = require('path');

var logger = require('morgan');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var basicAuth = require('express-basic-auth');

var app = module.exports = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

/*
    Configuration
*/

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// Dev Only!
if (app.get('env') === 'development') {
    app.use(errorHandler());
}
// Prod Only!
else if (app.get('env') === 'production') {

}

/*
    Routes
*/

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// json API
app.use('/api', basicAuth({
    users: { [process.env.AUTH_USER]: process.env.AUTH_PASS },
    challenge: true
}));
app.get('/api/seasons', api.seasons);
app.get('/api/seasons/:id', api.season);
app.get('/api/games/:id', api.game);

// redirect everything else to index
app.get('*', routes.index);

// Socket.io communication
io.sockets.on('connection', require('./routes/socket')(io));

/*
    Start Server
*/

if (require.main === module) {
    server.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
}