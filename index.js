// Load Requirments

const express = require("express");
const app = express();
// default port 8080
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Set Middleware

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Prefilled "Databases"

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Helpful Functions

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 2176782336).toString(36).substring(1);
};

const alreadyRegistered = function(mail) {
  let isIt = false;
  for (const user in users) {
    console.log(users[user].email, mail);
    if (users[user].email === mail) {
      isIt = true;
    }
  }
  console.log(isIt);
  return isIt;
};

// Server Routing

app.locals.urls = urlDatabase;
app.locals.users = users;

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/login', (req, res) => {
  res.render('urls-login');
});

app.post('/login', (req, res) => {

  res.redirect(303, '/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect(303, '/urls');
});

app.get('/register', (req, res) => {
  res.locals.username = req.cookies.username;
  res.render('urls-register');
});

app.post('/register', (req, res) => {
  const newId = generateRandomString();
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Bad Request: Missing Email or Password');
  } else if (alreadyRegistered(req.body.email)) {
    res.status(400).send('Bad Request: Email already registered');
  } else {
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', newId);
    res.redirect(303, '/urls');
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(301, longURL ? longURL : '/urls');
});

app.get('/urls', (req, res) => {
  res.locals.username = req.cookies.username;
  res.render('urls-index');
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const {longURL} = req.body;
  const schemeIncluded = longURL.search(':');
  urlDatabase[shortURL] = (schemeIncluded !== -1) ? longURL : `http://${longURL}`;
  res.redirect(303, `/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  res.locals.username = req.cookies.username;
  res.render('urls-new');
});

app.get('/urls/:id', (req, res) => {
  res.locals.shortURL = req.params.id;
  res.locals.username = req.cookies.username;
  res.render('urls-show');
});

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(303, '/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(303, '/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});