const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs').promises;
const readFile = require('./helpers/readFile');
const loginValidation = require('./helpers/loginValidation');
const { tokenValidation,
  nameValidation,
  ageValidation,
  talkValidation,
  rateValidation,
  watchedDateValidation } = require('./helpers/postValidation');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar.
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});

app.get('/talker', async (_req, res) => {
  const response = await readFile();
  res.status(200).json(response);
});

app.get('/talker/search',
  tokenValidation,
  async (req, res) => {
    const { q } = req.query;
    const talkers = await readFile();
    const result = talkers.filter((talker) => talker.name.includes(q));
    res.status(200).json(result);
  });

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const response = await readFile();
  const talker = response.find((t) => t.id === Number(id));

  if (!talker) {
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }

  res.status(200).json(talker);
});

app.post('/login', loginValidation, (req, res) => {
  const token = crypto.randomBytes(8).toString('hex');

  return res.status(200).json({ token });
});

app.post('/talker',
  tokenValidation,
  nameValidation,
  ageValidation,
  talkValidation,
  rateValidation,
  watchedDateValidation,
  async (req, res) => {
    const { name, age, talk } = req.body;

    const talkers = await readFile();
    const newTalker = {
      id: talkers.length + 1,
      name,
      age,
      talk,
    };

    talkers.push(newTalker);
    await fs.writeFile('./talker.json', JSON.stringify(talkers)); 
    res.status(201).json(newTalker);
  });

  app.put(
    '/talker/:id',
    tokenValidation,
    nameValidation,
    ageValidation,
    talkValidation,
    watchedDateValidation,
    rateValidation,
    async (req, res) => {
      const { id } = req.params;
      const { name, age, talk } = req.body;
      const talkers = await readFile();
      const index = talkers.findIndex((talker) => talker.id === Number(id));
      if (index === -1) {
        return res.status(404).json({ message: 'Talker not found' });
      }
      talkers[index] = { ...talkers[index], name, age, talk };
      await fs.writeFile('./talker.json', JSON.stringify(talkers));
      res.status(200).json({ id: Number(id), name, age, talk });
    },
  );

  app.delete(
    '/talker/:id',
    tokenValidation,
    async (req, res) => {
      const { id } = req.params;
      const talkers = await readFile();
      const index = talkers.findIndex((talker) => talker.id === Number(id));
      if (index === -1) return res.status(404).json({ message: 'Talker not found' });
      talkers.splice(index, 1);
      await fs.writeFile('./talker.json', JSON.stringify(talkers));
      res.status(204).end();
    },
  );
