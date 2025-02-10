"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const Chat_1 = require("./Chat");
const uuid_1 = require("uuid");
const message_1 = require("./message");
class ChatManager {
    constructor() {
        this.chats = new Map();
        this.users = new Map();
    }
    addUser(socket) {
        this.users.set(socket, ""); // No room assigned yet
        this.addHandler(socket);
    }
    removeUser(socket) {
        const roomId = this.users.get(socket);
        if (roomId) {
            const chat = this.chats.get(roomId);
            if (chat) {
                if (chat.user1 === socket) {
                    chat.user1 = chat.user2;
                    chat.user2 = null;
                }
                else if (chat.user2 === socket) {
                    chat.user2 = null;
                }
                if (!chat.user1 && !chat.user2) {
                    this.chats.delete(roomId);
                }
            }
        }
        this.users.delete(socket);
    }
    addHandler(socket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === message_1.INIT) {
                if (message.roomId) {
                    this.joinRoom(socket, message.roomId);
                }
                else {
                    this.createRoom(socket);
                }
            }
            if (message.type === message_1.CHAT_LINES) {
                const roomId = this.users.get(socket);
                if (roomId) {
                    const chat = this.chats.get(roomId);
                    if (chat) {
                        chat.addMessage(socket, message.line);
                        console.log(message.line);
                    }
                }
            }
        });
        socket.on("close", () => {
            this.removeUser(socket);
        });
    }
    createRoom(socket) {
        const roomId = (0, uuid_1.v4)();
        const chat = new Chat_1.Chat(socket);
        this.chats.set(roomId, chat);
        this.users.set(socket, roomId);
        socket.send(JSON.stringify({
            type: "ROOM_CREATED",
            roomId: roomId,
        }));
    }
    joinRoom(socket, roomId) {
        const chat = this.chats.get(roomId);
        if (chat && chat.addUser(socket)) {
            this.users.set(socket, roomId);
            socket.send(JSON.stringify({
                type: "ROOM_JOINED",
                roomId: roomId,
            }));
        }
        else {
            socket.send(JSON.stringify({
                type: "ERROR",
                message: "Room not found or full.",
            }));
        }
    }
}
exports.ChatManager = ChatManager;
