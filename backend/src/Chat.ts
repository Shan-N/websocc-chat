import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { CHAT_LINES } from "./message";

export class Chat {
    public user1: WebSocket | null;
    public user2: WebSocket | null;
    // public roomId: string;

    constructor(user1: WebSocket | null,public roomId: string) {
        this.user1 = user1;
        this.user2 = null;
        this.roomId = uuidv4();
    }

    addUser(user: WebSocket): boolean {
        if (!this.user2) {
            this.user2 = user;

            if (this.user1) {
                this.user1.send(
                    JSON.stringify({ type: "USER_JOINED", message: "A user has joined the chat." })
                );
            }
            this.user2.send(
                JSON.stringify({ type: "USER_JOINED", message: "You joined the chat." })
            );

            return true;
        }
        return false; // Room is full
    }

    addMessage(socket: WebSocket, line: string) {
        if (socket !== this.user1 && socket !== this.user2) {
            console.error("Socket not part of this room. Message not sent.");
            return;
        }

        const recipient = socket === this.user1 ? this.user2 : this.user1;

        try {
            if (recipient){
            recipient.send(JSON.stringify({ type: CHAT_LINES, payload: line }))
            
            } else {
                console.error("Recipient socket is not available.")
            }
        } catch (error) {
            console.error(error);
            return;
        }
    }

    handleDisconnect(socket: WebSocket) {
        if (socket === this.user1) {
            this.user1 = this.user2;
            this.user2 = null;
        } else if (socket === this.user2) {
            this.user2 = null;
        }

        if (this.user1) {
            this.user1.send(
                JSON.stringify({ type: "USER_LEFT", message: "Your chat partner has left." })
            );
        }
    }

    isEmpty(): boolean {
        return this.user1 === null && this.user2 === null;
    }
}
