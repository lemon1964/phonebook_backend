require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()
app.use(express.static('dist'))
app.use(express.json())
app.use(cors())

morgan.token('body', function (req) {
  return JSON.stringify(req.body)
})

morgan.format('combined', ':method :url :status :res[content-length] - :response-time ms :body')
app.use(morgan('combined'))

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/info', (request, response, next) => {
  Person.countDocuments({})
    .then(count => {
      response.send(
        `<p>Phonebook has info for ${count} people</p>
         <p>${new Date()}</p>`
      )
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => response.json(persons))
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  if (!name || !number) {
    return response.status(400).json({ error: 'name or number missing' })
  }

  Person.findOne({ name })
    .then(existingPerson => {
      if (existingPerson) {
        return response.status(400).json({ error: 'This name is already added to phonebook' })
      }

      const person = new Person({ name, number })

      return person.save()
    })
    .then(savedPerson => response.json(savedPerson))
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => response.status(204).end())
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (updatedPerson) {
        response.json(updatedPerson)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoError') {
    return response.status(500).json({ error: 'Database error' })
  }

  response.status(500).json({ error: 'Internal server error' })
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
