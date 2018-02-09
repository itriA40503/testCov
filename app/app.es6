import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import sassMiddleware from 'node-sass-middleware';
import helmet from 'helmet';
// import passport from 'passport';
// import session from 'express-session';
// import flash from 'connect-flash';
import timeout from 'connect-timeout';
import config from './config';
import CdError from './util/CdError';
import jwtAuth from './middleware/jwtAuth';
import setupRouters from './routes';
import setupApiDoc from './doc';

const app = express();

app.set('jwtsecretkey', 'KemonoFriends');
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');
app.set('json spaces', 2);

// Add security header
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'www.youtube.com', 'fonts.googleapis.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
    fontSrc: ["'self'", 'fonts.gstatic.com data:'],
    imgSrc: ["'self'", 'www.youtube.com', '* data:'],    
    scriptSrc: ["'self'", 'www.youtube.com', 's.ytimg.com']
  }
}));

// app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
logger.format('detailed', (token, req, res) => {
  return `${req.method}:${req.path} ${JSON.stringify(req.body)} -> ${res.statusCode}\n`;
});

// app.use(logger('dev'));
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, '../public'),
  dest: path.join(__dirname, '../public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));

if (!config.report.coverage.disable) app.use('/report/coverage', express.static(path.join(__dirname, '../test/coverage/lcov-report')));
if (!config.report.testing.disable) app.use('/report/testing', express.static(path.join(__dirname, '../test/testing')));

app.use(express.static(path.join(__dirname, '../public')));
app.use(timeout(12000));

// register logging middleware and use custom logging format
if (!config.logger.disable) app.use(logger('detailed'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});
// app.use('/apidoc', express.static(path.join(__dirname, '../apidoc')));
app.use('/portal', express.static(path.join(__dirname, '../portal')));

if (config.apidoc) setupApiDoc(app);
setupRouters(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  throw new CdError(404, 'Not Found');
});

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const errorView = 'error';
  res.status(status);

  if (status !== 400 && status !== 401 && status !== 404) console.log(err);

  const responseMessage = {
    code: err.errorCode || status,
    message: (req.app.get('env') === 'development') ? err.message : '',
  };

  if (req.accepts('html')) {
    responseMessage.status = status;
    res.render(errorView, responseMessage);
  } else {
    res.json(responseMessage);
  }
});

module.exports = app;
