// Load Requirments
//-----------------
const express = require("express");
const app = express();
//  default port 8080
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Set Middleware
//---------------
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['thisKeyIsTooHard', 'ThisKeyIsTooSoft', 'ThisKeyIsJustRight']
}));

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
  res.locals.userId = req.session.userId;
  next();
});

// Server Routing
//---------------
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('urls-login');
});

app.post('/login', (req, res) => {
  user = isRegistered(req.body.email);
  if (user && bcrypt.compareSync(req.body.password, users[user].password)) {
    req.session.userId = user;
    res.redirect(303, '/urls');
  } else {
    res.status(403).send('Login Error: Email or Password Incorrect.');
  }
});

app.post('/logout', (req, res) => {
  req.session.userId = '';
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
    req.session.userId = newId;
    res.redirect(303, '/urls');
  }
});

app.get('/u/:id', (req, res) => {
  if (urlDatabase[req.params.id]) {
    res.redirect(301, urlDatabase[req.params.shortURL].url);
  } else {
    res.locals.error = 'noLink';
    res.render('error');
  }
});

app.get('/urls', (req, res) => {
  if (res.locals.userId) {
    const userUrls = urlsForUser(res.locals.userId);
    res.locals.urls = userUrls;
    res.render('urls-index');
  } else {
    res.locals.error = 'noLogin';
    res.render('error');
  }
});

app.post('/urls', (req, res) => {
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
    res.locals.error = 'noLogin';
    res.render('error');
  }
});

app.get('/urls/new', (req, res) => {
  if (res.locals.userId) {
    res.render('urls-new');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  const urlId = req.params.id;
  if (urlDatabase[urlId] && res.locals.userId === urlDatabase[urlId].userId) {
    res.locals.shortURL = urlId;
    res.render('urls-show');
  } else {
    if (res.locals.userId) {
      res.locals.error = 'notYours';
    } else {
      res.locals.error = 'noLogin';
    }
    res.render('error');
  }
});

app.post('/urls/:id', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    targetURL.url = req.body.longURL;
    res.redirect(303, '/urls');
  } else {
    if (res.locals.userId) {
      res.locals.error = 'notYours';
    } else {
      res.locals.error = 'noLogin';
    }
  }
  res.render('error');
});

app.post('/urls/:id/delete', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    delete urlDatabase[req.params.id];
    res.redirect(303, '/urls');
  } else {
    if (res.locals.userId) {
      res.locals.error = 'notYours';
    } else {
      res.locals.error = 'noLogin';
    }
  }
  res.render('error');
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