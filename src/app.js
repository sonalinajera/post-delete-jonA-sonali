require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

function validateAuth(req, res, next) {
  const token = process.env.AUTH_KEY;
  const authMethod = req.get('Authorization');

  if (!authMethod || !authMethod.toLowerCase().startsWith("bearer ") || authMethod.substring(7).trim() !== token) {
    res.status(401).json({ error: 'Unauthorized access, please provide proper authentication' });
  } else {
    next();
  }

}

let addresses= [
  {
    id: 0,
    firstName: 'Michael',
    lastName: 'Meyers',
    address1: '1245 Main st',
    address2: 'APT B',
    city: 'Jolla',
    state: 'NV',
    zip: '38389'
  }
];

let nextId = 1;

app.get('/address', (req, res) => {

  res.send(addresses);
});

app.post('/address', validateAuth, (req, res) => {
  const addressBookEntry = req.body || {};
  const {firstName, lastName, address1, address2, city, state, zip} = addressBookEntry;
  const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'zip'];

  //validation
  //all fields required except address 2
  requiredFields.forEach((field) => {
    if(!addressBookEntry[field] || typeof addressBookEntry[field] !== 'string') {
      return res
        .status(400)
        .send(`String '${field}' is required`);
    }
  });
  // state must be exactly two characters
  if(state.length !== 2) {
    return res
      .status(400)
      .send('State code must be two characters');
  }
  //zip must be exactly a five-digit number
  if(!zip.match(/^\d{5}$/)) {
    return res
      .status(400)
      .send('Provide a 5 digit zipcode');
  }
  
  // auto generated id
  const id = nextId++;
  addresses.push({id, firstName, lastName, address1, address2, city, state, zip});
  res
    .status(201)
    .location(`http://localhost:8000/address/${id}`)
    .json({ id });
});

app.delete('/address/:id', validateAuth, (req, res) => {
  const { id } = req.params;

  const index = addresses.findIndex(address => address.id === id * 1);

  if (index >= 0) {
    addresses.splice(index, 1);
  }
  res.status(204).send();
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;