import { WebSocket } from "ws";
import { Chat } from "./Chat";
import { v4 as uuidv4 } from "uuid";
import { CHAT_LINES, INIT } from "./message";

export class ChatManager {
    private chats: Map<string, Chat>; 
    private users: Map<WebSocket, string>;

    constructor() {
        this.chats = new Map();
        this.users = new Map();
    }

    addUser(socket: WebSocket) {
        this.users.set(socket, ""); // No room assigned yet
        this.addHandler(socket);
    }

    removeUser(socket: WebSocket) {
        const roomId = this.users.get(socket);
        if (roomId) {
            const chat = this.chats.get(roomId);
            if (chat) {
                if (chat.user1 === socket) {
                    chat.user1 = chat.user2;
                    chat.user2 = null;
                } else if (chat.user2 === socket) {
                    chat.user2 = null;
                }

                if (!chat.user1 && !chat.user2) {
                    this.chats.delete(roomId); 
                }
            }
        }
        this.users.delete(socket);
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === INIT) {
                if (message.roomId) {
                    this.joinRoom(socket, message.roomId);
                } else {
                    this.createRoom(socket);
                }
            }

            if (message.type === CHAT_LINES) {
                const roomId = this.users.get(socket);
                if (roomId) {
                    const chat = this.chats.get(roomId);
                    if (chat) {
                        chat.addMessage(socket, message.line);
                    }
                }
            }
        });

        socket.on("close", () => {
            this.removeUser(socket);
        });
    }

    private createRoom(socket: WebSocket) {
        const roomId = uuidv4();
        const chat = new Chat(socket);
        this.chats.set(roomId, chat);
        this.users.set(socket, roomId);

        socket.send(
            JSON.stringify({
                type: "ROOM_CREATED",
                roomId: roomId,
            })
        );
    }

    private joinRoom(socket: WebSocket, roomId: string) {
        const chat = this.chats.get(roomId);
        if (chat && chat.addUser(socket)) {
            this.users.set(socket, roomId);
            socket.send(
                JSON.stringify({
                    type: "ROOM_JOINED",
                    roomId: roomId,
                })
            );
        } else {
            socket.send(
                JSON.stringify({
                    type: "ERROR",
                    message: "Room not found or full.",
                })
            );
        }
    }
}
