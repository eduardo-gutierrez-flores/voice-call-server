import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT } from './config';

const app = express();
app.use(cors);
const server = createServer(app);
const usersInCalls = [];
const usersActive = [];

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`conectado: ${socket.id}`)

    socket.on('create_user', (data) => {
        usersActive.push({username: data.username, id: socket.id, name: data.name, role: data.role});
        io.emit('new_active', usersActive)
    })
    
    socket.on('check_user', (data, callback) => {
        const userAvailable = usersActive.find((user) => user.username === data.username && user.role === data.role)
        callback(userAvailable)
    })
    
    socket.on('create_call', (data) => {
        socket.join(data.room)
        const name = usersActive.find((user) => user.username === data.name)
        const nameEmit = usersActive.find((user) => user.username === data.nameEmit)
        socket.to(data.id).emit('recive_call', {nameEmit: nameEmit.name, name: name.name, id: data.id, idEmit: socket.id, token: data.token, room: data.room})
    })

    socket.on('leave_call', (data) => {
        const index = usersInCalls.indexOf(data.id);
        usersInCalls.splice(index, 1);
        socket.to(data.room).emit('leave', {username: data.username, id: data.id, token: data.token})
        io.emit('users_in_call', usersInCalls)
        socket.leave(data.room)
    })
    
    socket.on('cancel_call', (data) => {
        socket.to(data.id).emit('leave', {username: data.username, id: data.id, token: data.token})
    })
    
    socket.on('answer_call', (data) => {
        socket.join(data.room)
        usersInCalls.push(data.id, data.idEmit)
        io.emit('users_in_call', usersInCalls)
    })
    
    socket.on('disconnect', (data) => {
        const user = usersActive.find((user) => user.id === socket.id);
        const index = usersActive.indexOf(user);
        usersActive.splice(index, 1);
        io.emit('new_active', usersActive)
    }) 
})

server.listen(PORT, () => console.log('server on', PORT))