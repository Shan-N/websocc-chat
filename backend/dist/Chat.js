"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const uuid_1 = require("uuid");
const ws_1 = require("ws");
const message_1 = require("./message");
class Chat {
    constructor(user1, user2) {
        this.user1 = user1;
        this.user2 = user2;
        this.roomId = (0, uuid_1.v4)();
    }
    addMessage(socket, line) {
        if (socket !== this.user1 && socket !== this.user2) {
            console.error("Socket not part of this room. Message not sent.");
            return;
        }
        // Send message to the other user
        const recipient = socket === this.user1 ? this.user2 : this.user1;
        if (recipient.readyState === ws_1.WebSocket.OPEN) {
            recipient.send(JSON.stringify({
                type: message_1.CHAT_LINES,
                payload: line
            }));
        }
        else {
            console.error("Recipient is not connected.");
        }
    }
}
exports.Chat = Chat;
