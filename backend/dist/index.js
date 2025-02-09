"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const ChatManager_1 = require("./ChatManager");
const wss = new ws_1.WebSocket.Server({ port: 8080 });
const chatManager = new ChatManager_1.ChatManager();
wss.on("connection", (ws) => {
    chatManager.addUser(ws);
    ws.on('disconnected', () => chatManager.removeUser(ws));
    ws.send('lmao');
});
