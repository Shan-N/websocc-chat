"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const Chat_1 = require("./Chat");
const message_1 = require("./message");
class ChatManager {
    constructor() {
        this.chats = [];
        this.users = [];
        this.pendingUser = null;
    }
    addUser(socket) {
        this.users.push(socket);
        this.addHandler(socket);
    }
    removeUser(socket) {
        this.users = this.users.filter(s => s !== socket);
    }
    addHandler(socket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === message_1.INIT) {
                if (this.pendingUser) {
                    const chat = new Chat_1.Chat(this.pendingUser, socket);
                    this.chats.push(chat);
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                }
            }
            if (message.type === message_1.CHAT_LINES) {
                const chat = this.chats.find(chat => chat.user1 === socket || chat.user2 === socket);
                if (chat) {
                    chat.addMessage(socket, message.line);
                }
            }
        });
    }
}
exports.ChatManager = ChatManager;
