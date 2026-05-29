const express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;

  app.get('/', (req, res) => res.send('Afk bot is running!'));

  function keep_alive() {
    app.listen(port, '0.0.0.0', () => console.log(`Afk bot is listening on port ${port}`));
  }

  module.exports = { keep_alive };
  