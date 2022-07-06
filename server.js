const  express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors);
const server = createServer(app);
const usersInCalls = [];

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`conectado: ${socket.id}`)

    socket.on('create_user', (data) => {
        socket.broadcast.emit('new_active', {name: data.name, id: socket.id})
        // socket.join(socket.id)
    })
    
    socket.on('create_call', (data) => {
        socket.join(data.room)
        socket.to(data.id).emit('recive_call', {nameEmit: data.nameEmit, name: data.name, id: data.id, idEmit: socket.id, token: data.token, room: data.room})
    })

    socket.on('leave_call', (data) => {
        console.log(data);
        const index = usersInCalls.indexOf(data.id);
        usersInCalls.splice(index, 1);
        socket.to(data.room).emit('leave', {name: data.name, id: data.id, token: data.token})
        io.emit('users_in_call', usersInCalls)
        socket.leave(data.room)
        // socket.join(socket.id)
    })
    
    socket.on('answer_call', (data) => {
        console.log(data);
        socket.join(data.room)
        usersInCalls.push(data.id, data.idEmit)
        io.emit('users_in_call', usersInCalls)
        // socket.join(socket.id)
    })
})

server.listen(3001, () => console.log('server on'))