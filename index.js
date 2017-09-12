const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 2176782336).toString(36).substring(1);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render('urls-index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send('ok');
});

app.get('/urls/new', (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render('urls-new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render('urls-show', templateVars);
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