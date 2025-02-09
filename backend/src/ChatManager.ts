import { WebSocket } from "ws";
import { Chat } from "./Chat";
import { v4 as uuidv4 } from 'uuid'
import { CHAT_LINES, INIT } from "./message";



export class ChatManager {
    private chats : Chat[];
    private users : WebSocket[];
    private pendingUser : WebSocket | null;
    constructor() {
        this.chats = [];
        this.users = [];
        this.pendingUser = null;
    }

    addUser(socket : WebSocket){
        this.users.push(socket);
        this.addHandler(socket);
    }
    
    removeUser(socket : WebSocket){
        this.users = this.users.filter(s => s!== socket);
    }

    private addHandler(socket : WebSocket){
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if(message.type === INIT) {
                if(this.pendingUser){
                    const chat = new Chat(this.pendingUser, socket);
                    this.chats.push(chat);
                    this.pendingUser = null;
                }
                else{
                    this.pendingUser = socket;
                }
            }
            if(message.type === CHAT_LINES){
                const chat = this.chats.find(chat => chat.user1 === socket || chat.user2 === socket);
                if(chat){
                    chat.addMessage(socket, message.line);
                }
            }
        })
    }
}