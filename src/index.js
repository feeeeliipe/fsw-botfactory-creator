const express = require('express');
const bodyParser = require('body-parser');

const app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

require('./controllers/botfactory.controller')(app);

app.listen(3001);