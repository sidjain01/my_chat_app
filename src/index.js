const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
// const Filter = require('bad-words')....This package is used to get rid of profanity(bad-words).Checkout docs if wants to implement
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser , getUser, getUserInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket) =>{
    socket.on('join', ({username, room},callback)=>{
        const {error, user} = addUser({
            id : socket.id,
            username,
            room
        })
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUserInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage',(message, callback)=>{
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage(user.username,message))
            callback('Delivered!')
        }
    })
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUserInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation',(location, callback)=>{
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longtitude}`))
            callback('Delivered!')
        }
    })
})

server.listen(port,() =>{
    console.log(`Server is up at port ${port}!`)
})