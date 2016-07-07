import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import config from '../src/config';
import * as actions from './actions/index';
import {mapUrl} from './utils/common.js';
import PrettyError from 'pretty-error';
import http from 'http';
import SocketIo from 'socket.io';
import DB from './lib/db-interface.js';
import sitemap from './lib/sitemap.js';
const MongoStore = require('connect-mongo')(session);
import {logger} from './lib/logger';
var cors = require('cors');


var mongoModel = require('./lib/model.js')
var mongoConnection = mongoModel.initMongoDb()



const pretty = new PrettyError();
const app = express();

const server = new http.Server(app);

const io = new SocketIo(server);

app.use(session({
  secret: 'hanwen is cool!!!!',
  store : new MongoStore({ mongooseConnection: mongoConnection }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: config.sessionAge }
}));
app.use(bodyParser.json());

var corsOptions = { credentials : false}
app.use(cors(corsOptions));

app.use((req, res) => {
  logger.info("get request :", req.url)

  const splittedUrlPath = req.url.split('?')[0].split('/').slice(1);

  const {action, params} = mapUrl(actions, splittedUrlPath);

  if (action) {
    action(req, params, io)
      .then((result) => {
        if (result instanceof Function) {
          result(res);
        } else {
          res.json(result);
        }
      }, (reason) => {
        if (reason && reason.redirect) {
          res.redirect(reason.redirect);
        } else {
          logger.error('API ERROR:', pretty.render(reason));
          res.status(reason.status || 500).json(reason);
        }
      });
  } else {
    res.status(404).end('NOT FOUND');
  }
});


const bufferSize = 100;
const messageBuffer = new Array(bufferSize);
let messageIndex = 0;

if (config.apiPort) {
  const runnable = app.listen(config.apiPort, (err) => {
    if (err) {
      logger.error(err);
    }
    logger.info('----\n==> 🌎  API is running on port %s', config.apiPort);
    logger.info('==> 💻  Send requests to http://%s:%s', config.apiHost, config.apiPort);
  });
  app.set('socketio', io);
  app.set('server', runnable);
  io.on('connection', (socket) => {

    console.log('a new customer connect to server')
    socket.emit('greet', {msg: `'Hello World!' from server`});

    socket.on('sendHelp', function(ev,data){
      socket.emit("sendHelpAsker" + data.asker, data)
    })

    socket.on('sendUpdate', function(ev,data){
      socket.emit('updateHelper' + data.helper, data)
    })
  });
  io.listen(runnable);
} else {
  logger.error('==>     ERROR: No PORT environment variable has been specified');
}
