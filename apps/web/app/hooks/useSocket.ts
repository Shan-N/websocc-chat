'use client';
import { useEffect, useState } from "react";


export const useSocket = () => {
    const [useSocket, setUseSocket] = useState<WebSocket | null>(null);

    useEffect( () => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
            setUseSocket(ws);
        }

        ws.onclose = () => {
            setUseSocket(null);
        }

        return () => {
            ws.close();
        }
    }, []);
    return useSocket;
}