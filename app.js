//var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let apiRouter = require("./routes/api");
var app = express();
const sequelize = require('./models/index');
const createError = require("http-errors");
const consts = require("./utility/consts");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ghdfhfghdghdghjj',
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 10*60*1000 }
}));


(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/api",apiRouter);


//catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    pageTitle: consts.PAGE_TITLE_ERROR,
    message: consts.DEFAULT_ERROR_PAGE_MESSAGE,
    error: "",
    tabTitle: consts.TAB_ERROR
  });
});

module.exports = app;
