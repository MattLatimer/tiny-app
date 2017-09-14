// Load Requirments
//-----------------
const express = require("express");
const app = express();
//  default port 8080
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

// Set Middleware
//---------------
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Prefilled "Databases"
//----------------------
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userId: 'userRandomID'
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userId: 'user2RandomID'
  }
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
//------------------
const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 2176782336).toString(36).substring(1);
};

const isRegistered = function(mail) {
  for (const user in users) {
    if (users[user].email === mail) {
      return user;
    }
  }
  return false;
};

const urlsForUser = function(uid) {
  const shortList = {};
  for (const key in urlDatabase) {
    if (uid === urlDatabase[key].userId) {
      shortList[key] = { url: urlDatabase[key].url };
    }
  }
  return shortList;
};

// Preset Variables
//-----------------
app.locals.urls = urlDatabase;
app.locals.users = users;

// Cookie Handling
//----------------
app.use((req, res, next) => {
  res.locals.userId = req.cookies.user_id;
  next();
});

// Server Routing
//---------------
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/login', (req, res) => {
  res.render('urls-login');
});

app.post('/login', (req, res) => {
  user = isRegistered(req.body.email);
  if (user && bcrypt.compareSync(req.body.password, users[user].password)) {
    res.cookie('user_id', user);
    res.redirect(303, '/urls');
  } else {
    res.status(403).send('Login Error: Email or Password Incorrect.');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect(303, '/urls');
});

app.get('/register', (req, res) => {
  res.render('urls-register');
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Bad Request: Missing Email or Password');
  } else if (isRegistered(req.body.email)) {
    res.status(400).send('Bad Request: Email Already Registered');
  } else {
    const newId = generateRandomString();
    users[newId] = {
      id: newId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    res.cookie('user_id', newId);
    res.redirect(303, '/urls');
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(301, longURL ? longURL : '/urls');
});

app.get('/urls', (req, res) => {
  const userUrls = urlsForUser(res.locals.userId);
  res.locals.urls = userUrls;
  res.render('urls-index');
});

app.get('/urls/new', (req, res) => {
  if (res.locals.userId) {
    res.render('urls-new');
  } else {
    res.redirect('/login');
  }
});

app.post('/urls/new', (req, res) => {
  if (res.locals.userId) {
    const shortURL = generateRandomString();
    const {longURL} = req.body;
    const schemeIncluded = longURL.search(':');
    urlDatabase[shortURL] = {
      url: (schemeIncluded !== -1) ? longURL : `http://${longURL}`,
      userId: res.locals.userId
    };
    res.redirect(303, `/urls/${shortURL}`);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  if (res.locals.userId === urlDatabase[req.params.id].userId) {
    res.locals.shortURL = req.params.id;
    res.render('urls-show');
  } else {
    res.status(403).send('This doesn\'t belong to you!');
  }
});

app.post('/urls/:id/update', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    targetURL.url = req.body.longURL;
  }
  res.redirect(303, '/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    delete urlDatabase[req.params.id];
  }
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