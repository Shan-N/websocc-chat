import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket'; // assumes useSocket connects socket

export const JOIN = 'join_chat';
export const CHAT_LINES = 'chat_lines';

export const Chat = () => {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const socket = useSocket();

  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    
    if (socket && roomId) {
      // Join the room on connection
      socket.send(JSON.stringify({
        type: JOIN,
        roomId: roomId,
      }));

      socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        if (data.type === CHAT_LINES) {
          setMessages((prev) => [...prev, data.message]);
        }
      };

      return () => {
        socket.onmessage = null;
      };
    }
  }, [socket, roomId]);

  const sendMessage = () => {
    if (input.trim()) {
      socket?.send(JSON.stringify({
        type: CHAT_LINES,
        line: input.trim(),
      }));
      setMessages((prev) => [...prev, `You: ${input.trim()}`]);
      setInput('');
    }
  };

  return (
    <div className='p-4 text-white'>
      <h2 className='text-2xl mb-4'>Room ID: {roomId}</h2>
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
