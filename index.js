require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');

const app = express();
app.use(express.static('dist'));
app.use(express.json());
app.use(cors());

morgan.token('body', function (req) { 
  return JSON.stringify(req.body);
});

morgan.format('combined', ':method :url :status :res[content-length] - :response-time ms :body');
app.use(morgan('combined'));

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>');
});

app.get('/info', (request, response) => {
  Person.countDocuments({})
    .then(count => {
      response.send(
        `<p>Phonebook has info for ${count} people</p>
         <p>${new Date()}</p>`
      );
    });
});

app.get('/api/persons', (request, response) => {
  Person.find({})
    .then(persons => {
      response.json(persons);
    })
    .catch(error => {
      response.status(500).send({ error: 'Failed to retrieve data' });
    });
});

app.post('/api/persons', (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'name or number missing' });
  }

  Person.findOne({ name: body.name })
    .then(existingPerson => {
      if (existingPerson) {
        return response.status(400).json({ error: 'This name is already added to phonebook' });
      }

      const person = new Person({
        name: body.name,
        number: body.number,
      });

      return person.save();
    })
    .then(savedPerson => {
      response.json(savedPerson);
    })
    .catch(error => {
      console.error('Error saving person to MongoDB:', error);
      response.status(500).send({ error: 'Failed to save person' });
    });
});

app.get('/api/persons/:id', (request, response) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch(error => next(error))
});

app.delete('/api/persons/:id', (request, response) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end();
    })
    .catch(error => next(error))
});

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
