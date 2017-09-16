// Load Requirments
//-----------------
const express = require("express");
const methodOverride = require('method-override');
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
app.use(methodOverride('_method'));

// "Databases"
//----------------------
const urlDatabase = {};

const users = {};

// Helpful Functions
//------------------
const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 2176782336).toString(36).substring(1);
};

const emailToId = function(mail) {
  for (const user in users) {
    if (users[user].email === mail) {
      return user;
    }
  }
  return false;
};

const urlsForUser = function(uid) {
  const shortList = [];
  for (const key in urlDatabase) {
    if (uid === urlDatabase[key].userId) {
      shortList.push(key);
    }
  }
  return shortList;
};

// Preset Variables
//-----------------
app.locals.urlDatabase = urlDatabase;
app.locals.users = users;

// Cookie Handling
//----------------
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  if (!req.session.visitorId) {
    req.session.visitorId = generateRandomString();
  }
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

app.get('/error/:err', (req, res) => {
  res.locals.error = req.params.err;
  res.render('error');
});

app.get('/login', (req, res) => {
  if (res.locals.userId) {
    res.redirect(303, 'urls');
  } else {
    res.render('urls-login');
  }
});

app.post('/login', (req, res) => {
  user = emailToId(req.body.email);
  if (user && bcrypt.compareSync(req.body.password, users[user].password)) {
    req.session.userId = user;
    res.redirect(303, '/urls');
  } else {
    res.redirect('/error/badLogin');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect(303, '/urls');
});

app.get('/register', (req, res) => {
  if (res.locals.userID) {
    res.redirect(303, '/urls');
  } else {
    res.render('urls-register');
  }
});

app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.redirect('/error/emptyField');
  } else if (emailToId(req.body.email)) {
    res.redirect('/error/nameTaken');
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
  const tinyURL = urlDatabase[req.params.id];
  const visitor = req.session.visitorId;
  if (tinyURL) {
    tinyURL.visits.push({
      visitorID: visitor,
      visitTime: new Date().toString()
    });
    if (tinyURL.visitors.indexOf(visitor) === -1) {
      tinyURL.visitors.push(visitor);
    }
    res.redirect(301, tinyURL.url);
  } else {
    res.redirect('/error/noLink');
  }
});

app.get('/urls', (req, res) => {
  if (res.locals.userId) {
    const userUrls = urlsForUser(res.locals.userId);
    res.locals.userUrls = userUrls;
    res.render('urls-index');
  } else {
    res.redirect('/error/noLogin');
  }
});

app.post('/urls', (req, res) => {
  if (res.locals.userId) {
    const shortURL = generateRandomString();
    const {longURL} = req.body;
    const schemeIncluded = longURL.search(':');
    urlDatabase[shortURL] = {
      url: (schemeIncluded !== -1) ? longURL : `http://${longURL}`,
      userId: res.locals.userId,
      time: new Date().toDateString(),
      visits: [],
      visitors: []
    };
    res.redirect(303, `/urls/${shortURL}`);
  } else {
    res.redirect('/error/noLogin');
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
      res.redirect('/error/notYours');
    } else {
      res.redirect('/error/noLogin');
    }
  }
});

app.put('/urls/:id', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    targetURL.url = req.body.longURL;
    res.redirect(303, '/urls');
  } else {
    if (res.locals.userId) {
      res.redirect('/error/notYours');
    } else {
      res.redirect('/error/noLogin');
    }
  }
});

app.delete('/urls/:id/delete', (req, res) => {
  const targetURL = urlDatabase[req.params.id];
  if (res.locals.userId === targetURL.userId) {
    delete urlDatabase[req.params.id];
    res.redirect(303, '/urls');
  } else {
    if (res.locals.userId) {
      res.redirect('/error/notYours');
    } else {
      res.redirect('/error/noLogin');
    }
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`tinyURL listening on port ${PORT}!`);
});