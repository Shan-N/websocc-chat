import WebSocket from "ws";
import { ChatManager } from "./ChatManager";

const wss = new WebSocket.Server({ port: 8080 });

const chatManager = new ChatManager();

wss.on("connection", (ws) => {
    chatManager.addUser(ws)
    ws.on('disconnected', () => chatManager.removeUser(ws))
    ws.send('lmao')
})