const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin, 
    getCurrentUser,
    userLeave, 
    getRoomUsers
} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//pasta estática
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Levi - ContratoSeguro';

//rodar quando o client conectar
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) =>{
        const user = userJoin(socket.id, username, room);


        socket.join(user.room);

    //boas vindas para o usuario
    socket.emit('message', formatMessage(botName, 'Bem-vindo ao chat da ContratoSeguro!'));

    //tramiste quando um usuário conectar
    socket.broadcast
        .to(user.room)
        .emit('message',formatMessage(botName, `${user.username} juntou-se ao chat!`)
        );

        // informações da sala
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // ouve o chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username, msg));
    });

    //transmite quando um clint disconecta
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit(
                'message'
                ,formatMessage(botName, `${user.username} saiu do chat`)
                );

        // informações da sala
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));