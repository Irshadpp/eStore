require('dotenv').config
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const nocache = require('nocache');
const {v4:uuidv4} = require('uuid');
const passport = require('passport')

require('./util/passportSetup');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

// database connection
const connectDB = require('./database/connection')
connectDB()

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'images')));

//create session;
const sessionSecret = uuidv4();
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());



app.use('/', indexRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
 res.render('user/page404');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
  res.render('user/page404');
});

app.listen(3000)