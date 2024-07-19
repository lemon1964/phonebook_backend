const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://sv444444:${password}@fullstack.gbitkdt.mongodb.net/personApp?retryWrites=true&w=majority&appName=fullstack`

mongoose.set('strictQuery', false)

mongoose.connect(url).catch((error) => {
  console.error('Error connecting to MongoDB:', error)
})

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length === 5) {
  const person = new Person({
    name: process.argv[3],
    number: process.argv[4],
  })
  person
    .save()
    .then((result) => {
      console.log(
        'added',
        result.name,
        'number',
        result.number,
        'to phonebook'
      )
      mongoose.connection.close()
    })
    .catch((error) => {
      console.error('Error saving person to MongoDB:', error)
      mongoose.connection.close()
    })
} else if (process.argv.length === 3) {
  Person.find({}).then((result) => {
    console.log('phonebook:')
    result.forEach((person) => {
      console.log(person.name, person.number)
    })
    mongoose.connection.close()
  })
    .catch((error) => {
      console.error('Error retrieving data from MongoDB:', error)
      mongoose.connection.close()
    })
} else {
  console.log('Invalid number of arguments')
  mongoose.connection.close()
}
