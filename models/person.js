require('dotenv').config()
const mongoose = require('mongoose')

const url = process.env.MONGODB_URL

mongoose.set('strictQuery', false)

mongoose.connect(url)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  number: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{2,3}-\d{5,}$/.test(v)
      },
      message: props => `${props.value} is not a valid phone number!`,
    },
    required: {
      value: true,
      message: 'Phone number is missing!',
    },
  },
}, { collection: 'people' })

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Person', personSchema)
