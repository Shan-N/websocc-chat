import { WebSocket } from "ws";
import { Chat } from "./Chat";
import { v4 as uuidv4 } from "uuid";
import { CHAT_LINES, INIT, JOIN } from "./message";
import Redis from 'ioredis';

const redisPub = new Redis({ host: 'localhost', port: 6379 });
const redisSub = new Redis({ host: 'localhost', port: 6379 });

export class ChatManager {
    private chats: Map<string, Chat>;
    private users: Map<WebSocket, string>;
    private subscribedRooms: Set<string>;

    constructor() {
        this.chats = new Map();
        this.users = new Map();
        this.subscribedRooms = new Set();

        redisSub.on("message", (channel, message) => {
            const chat = this.chats.get(channel);
            if (chat) {
                if (chat.user1) chat.user1.send(message);
                if (chat.user2) chat.user2.send(message);
            }
        });
    }

    addUser(socket: WebSocket) {
        this.users.set(socket, "");
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
                    // Optional: unsubscribe if no users left
                    redisSub.unsubscribe(roomId);
                    this.subscribedRooms.delete(roomId);
                }
            }
        }
        this.users.delete(socket);
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());

            if (message.type === INIT) {
                if(message.roomId) {
                    return;
                }
                this.createRoom(socket);
            }
            else if (message.type === JOIN){
                if (!message.roomId) {
                    socket.send(JSON.stringify({ type: "ERROR", message: "Room ID is required." }));
                    return;
                }
                this.joinRoom(socket, message.roomId);
            }

            if (message.type === CHAT_LINES) {
                const roomId = this.users.get(socket);
                if (roomId) {
                    const chat = this.chats.get(roomId);
                    if (chat) {
                        chat.addMessage(socket, message.line);
                        // Publish the message via Redis
                        redisPub.publish(roomId, JSON.stringify({ type: CHAT_LINES, payload: message.line }));
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
        const chat = new Chat(socket, roomId);
        this.chats.set(roomId, chat);
        this.users.set(socket, roomId);

        // Subscribe to the new room
        if (!this.subscribedRooms.has(roomId)) {
            redisSub.subscribe(roomId);
            this.subscribedRooms.add(roomId);
        }

        socket.send(JSON.stringify({
            type: "ROOM_CREATED",
            roomId: roomId,
        }));
    }

    private joinRoom(socket: WebSocket, roomId: string) {
        let chat = this.chats.get(roomId);
        if (!chat) {
            chat = new Chat(null,roomId); // allow joining a room that already exists in Redis
            this.chats.set(roomId, chat);
        }

        if (chat.addUser(socket)) {
            this.users.set(socket, roomId);

            // Subscribe once per room
            if (!this.subscribedRooms.has(roomId)) {
                redisSub.subscribe(roomId);
                this.subscribedRooms.add(roomId);
            }

            socket.send(JSON.stringify({
                type: "ROOM_JOINED",
                roomId: roomId,
            }));
        } else {
            socket.send(JSON.stringify({
                type: "ERROR",
                message: "Room not found or full.",
            }));
        }
    }
}
