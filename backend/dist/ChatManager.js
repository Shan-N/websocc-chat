"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const Chat_1 = require("./Chat");
const uuid_1 = require("uuid");
const message_1 = require("./message");
const ioredis_1 = __importDefault(require("ioredis"));
const redisPub = new ioredis_1.default({ host: 'localhost', port: 6379 });
const redisSub = new ioredis_1.default({ host: 'localhost', port: 6379 });
class ChatManager {
    constructor() {
        this.chats = new Map();
        this.users = new Map();
        this.subscribedRooms = new Set();
        redisSub.on("message", (channel, message) => {
            const chat = this.chats.get(channel);
            if (chat) {
                if (chat.user1)
                    chat.user1.send(message);
                if (chat.user2)
                    chat.user2.send(message);
            }
        });
    }
    addUser(socket) {
        this.users.set(socket, "");
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
                    // Optional: unsubscribe if no users left
                    redisSub.unsubscribe(roomId);
                    this.subscribedRooms.delete(roomId);
                }
            }
        }
        this.users.delete(socket);
    }
    addHandler(socket) {
        socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            if (message.type === message_1.INIT) {
                if (message.roomId) {
                    return;
                }
                this.createRoom(socket);
            }
            else if (message.type === message_1.JOIN) {
                if (!message.roomId) {
                    socket.send(JSON.stringify({ type: "ERROR", message: "Room ID is required." }));
                    return;
                }
                this.joinRoom(socket, message.roomId);
            }
            if (message.type === message_1.CHAT_LINES) {
                const roomId = this.users.get(socket);
                if (roomId) {
                    const chat = this.chats.get(roomId);
                    if (chat) {
                        chat.addMessage(socket, message.line);
                        // Publish the message via Redis
                        redisPub.publish(roomId, JSON.stringify({ type: message_1.CHAT_LINES, payload: message.line }));
                    }
                }
            }
        }));
        socket.on("close", () => {
            this.removeUser(socket);
        });
    }
    createRoom(socket) {
        const roomId = (0, uuid_1.v4)();
        const chat = new Chat_1.Chat(socket, roomId);
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
    joinRoom(socket, roomId) {
        let chat = this.chats.get(roomId);
        if (!chat) {
            chat = new Chat_1.Chat(null, roomId); // allow joining a room that already exists in Redis
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
