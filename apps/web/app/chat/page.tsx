'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';

const JOIN = 'join_chat';
const CHAT_LINES = 'chat_lines';

export default function Chat() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const [userId, setUserId] = useState<string | null>(null);
  const socket = useSocket();

  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

useEffect(() => {
  if (!socket) return;

  socket.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (!roomId && data.roomId) {
      setUserId(data.roomId);
    }

    if (data.type === CHAT_LINES) {
      setMessages(prev => [...prev, data.payload]);
    }
  };

  if (roomId) {
    socket.send(JSON.stringify({
      type: JOIN,
      roomId: roomId,
    }));
  } else {
    socket.send(JSON.stringify({ type: "init_chat" }));
  }

  return () => {
    socket.onmessage = null;
  };
}, [socket, roomId]);


  const sendMessage = () => {
    if (input.trim()) {
      socket?.send(JSON.stringify({
        type: CHAT_LINES,
        line: input.trim(),
      }));
      setMessages(prev => [...prev, `You: ${input.trim()}`]);
      setInput('');
    }
  };

  return (
    <div className='p-4 text-black'>
      <h2 className='text-2xl mb-4'>Room ID: {roomId || userId}</h2>
      <div className='mb-4'>
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        className='text-black p-2 rounded mr-2'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage} className='bg-blue-500 p-2 rounded'>
        Send
      </button>
    </div>
  );
}
