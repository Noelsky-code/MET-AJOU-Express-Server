import {
    getJoinedUsersState,
    getUserState
} from "./util.js"

import {
    defaultKeyBoardState
} from "./constant.js";

const UserIdToRoom = new Map();
const UsersState = new Map();

export const getJoinRoom = (userId) => UserIdToRoom.get(userId);

export const printConnection = (socket) => {
    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('socket 연결 성공 ip : ', ip);
    console.log('socket id : ', socket.id);
};

export const initSocketEvents = ({
    io,
    socket
}) => {
    socket.on('join', ({
        roomId,
        userId
    }) => {

        let _userId = UsersState.size + 1;
        UserIdToRoom.set(_userId, roomId);

        io.in(roomId).emit('joinNewUser', {
            userId: _userId,
            characterId: 1,
            position: {
                x: 1,
                y: 7,
                z: 1
            },
            keyState: defaultKeyBoardState
        });
        UsersState.set(_userId, {
            userId: _userId,
            position: {
                x: 1,
                y: 7,
                z: 1
            },
            characterId: 1,
            keyState: defaultKeyBoardState
        });

        const joinedUsers = getJoinedUsersState(UsersState, UserIdToRoom, roomId);
        io.to(socket.id).emit('joinRoom', joinedUsers);
        socket.join(roomId);
    });

    socket.on('chat', ({
        userId,
        message,
        position
    }) => {
        const roomId = getJoinRoom(userId);
        io.in(roomId).emit('chat', {
            userId,
            message,
            position,
        });
    });

    socket.on('keyDown', ({
        userId,
        keyState,
    }) => {
        const roomId = getJoinRoom(userId);
        const beforeUserState = getUserState(UsersState, userId);
        const changedUserState = {
            ...beforeUserState,
            keyState
        };

        UsersState.set(userId, changedUserState)
        const joinedUsers = getJoinedUsersState(UsersState, UserIdToRoom, roomId);
        io.in(roomId).emit('keyDown', joinedUsers);
    });

    socket.on('keyUp', ({
        userId,
        keyState,
    }) => {
        const roomId = getJoinRoom(userId);

        const beforeUserState = getUserState(UsersState, userId);
        const changedUserState = {
            ...beforeUserState,
            keyState
        };

        UsersState.set(userId, changedUserState);
        const joinedUsers = getJoinedUsersState(UsersState, UserIdToRoom, roomId);
        io.in(roomId).emit('keyUp', joinedUsers);

    });
};