"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const uuid_1 = require("uuid");
const message_1 = require("./message");
class Chat {
    constructor(user1) {
        this.user1 = user1;
        this.user2 = null;
        this.roomId = (0, uuid_1.v4)();
    }
    addUser(user) {
        if (!this.user2) {
            this.user2 = user;
            if (this.user1) {
                this.user1.send(JSON.stringify({ type: "USER_JOINED", message: "A user has joined the chat." }));
            }
            this.user2.send(JSON.stringify({ type: "USER_JOINED", message: "You joined the chat." }));
            return true;
        }
        return false; // Room is full
    }
    addMessage(socket, line) {
        if (socket !== this.user1 && socket !== this.user2) {
            console.error("Socket not part of this room. Message not sent.");
            return;
        }
        const recipient = socket === this.user1 ? this.user2 : this.user1;
        try {
            if (recipient) {
                recipient.send(JSON.stringify({ type: message_1.CHAT_LINES, payload: line }));
                console.log(line);
            }
            else {
                console.error("Recipient socket is not available.");
            }
        }
        catch (error) {
            console.error(error);
            return;
        }
    }
    handleDisconnect(socket) {
        if (socket === this.user1) {
            this.user1 = this.user2;
            this.user2 = null;
        }
        else if (socket === this.user2) {
            this.user2 = null;
        }
        if (this.user1) {
            this.user1.send(JSON.stringify({ type: "USER_LEFT", message: "Your chat partner has left." }));
        }
    }
    isEmpty() {
        return this.user1 === null && this.user2 === null;
    }
}
exports.Chat = Chat;
