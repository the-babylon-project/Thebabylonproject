const app = require('express')();

app.get('/', (req, res) => {
  res.send('Hello, Babylonians!\n');
});

app.listen(5000, '0.0.0.0');