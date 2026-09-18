require('dotenv').config()
const Person = require('./models/person')
const express = require('express')
var morgan = require('morgan')

morgan.token('type', (req, _) => JSON.stringify(req.body))
const customMorganFormat = morgan((tokens, req, res) => {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        tokens.type(req, res)
    ].join(' ')
})

const app = express()
app.use(express.static('dist'))
app.use(customMorganFormat)
app.use(express.json())

app.get('/api/persons', (_, res) => {
    Person.find({}).then(persons => res.json(persons))
})

app.get('/api/persons/:id', (req, res, next) => {
    const id = req.params.id
    Person.findById(id).then(person => {
        res.json(person)
    })
    .catch(err => next(err))
})

app.put('/api/persons/:id', (req, res, next) => {
    const id = req.params.id
    const number = req.body.number
    Person.findById(id).then(person => {
        person.number = number === null ? "" : number
        person.save().then(result => {
            res.json(result)
        })
        .catch(err => next(err))
    })
    .catch(err => next(err))
})

app.delete('/api/persons/:id', (req, res, next) => {
    const id = req.params.id 
    Person.findByIdAndDelete(id).then(_ => {
        console.log("ID deleted")
        res.status(204).send()
    })
    .catch(err => next(err))
})

app.post('/api/persons', (req, res, next) => {
    const name = req.body.name
    if (!name) {
        res.status(400).json({
            error: "'name' field required"
        })
        return 
    }  
    Person.find({name: { $ne: name }}).then(_ => {
        const newPerson = new Person({
            name: req.body.name,
            number: req.body.number === null ? "" : req.body.number 
        })

        newPerson.save().then(person => {
            res.json(person)
        })
        .catch(err => next(err))
    })
    .catch(err => next(err))
})

app.get('/info', (_, res, next) => {
    const receivedAt = new Date() 
    Person.find({}).then(persons => {
        res.send(`
            <p>Phonebook has info for ${persons.length} people</p>
            <p>${receivedAt}</p>
        `)
    })
    .catch(err => next(err))
    
})

const customErrorMiddleware = (err, req, res, next) => {
    console.log(err)
    if (err.name === 'CastError') {
        res.status(400).send({error: 'Malformed id'})
    } else if (err.name === 'ValidationError') {
        res.status(400).json({error: err.message})
    }
    next(err)
}

app.use(customErrorMiddleware)

const unknownEndpoint = (req, res) => {
    console.log("ASDSAAAD")
    res.status(404).send("Uknown endpoint")
}

app.use(unknownEndpoint)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`)
})