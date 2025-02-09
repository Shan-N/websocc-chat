import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws"
import { CHAT_LINES } from "./message";


export class Chat {
    public user1 : WebSocket;
    public user2 : WebSocket;
    public roomId : string;
    constructor(user1 : WebSocket, user2 : WebSocket){
        this.user1 = user1;
        this.user2 = user2;
        this.roomId = uuidv4();
    }

    addMessage(socket : WebSocket, line : string) {
        if (socket !== this.user1 && socket !== this.user2) {
            console.error("Socket not part of this room. Message not sent.");
            return;
        }

        // Send message to the other user
        const recipient = socket === this.user1 ? this.user2 : this.user1;
        
        if (recipient.readyState === WebSocket.OPEN) {
            recipient.send(JSON.stringify({
                type: CHAT_LINES,
                payload: line
            }));
        } else {
            console.error("Recipient is not connected.");
        }
    }
    }