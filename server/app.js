var express = require('express');
var cors = require('cors')
var stockRouter = require('./routes/stock');
var searchRouter = require('./routes/search');

var app = express();

app.use(cors())

const port = 8080;

app.use(express.json());

app.use('/stock', stockRouter);
app.use('/search', searchRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
