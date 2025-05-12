'use client';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';

export const INIT = 'init_chat';
export const JOIN = 'join_chat';
export const CHAT_LINES = 'chat_lines';

function Land() {
  const socket = useSocket();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [chat, setChat] = useState(false);
  const [userId, setUserId] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState<string>("");

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log(data);
        setRoomId(data.roomId);
        if (data.type === "USER_JOINED") {
          setChat(true);
        }
        else if (data.type === "ERROR"){
            alert(data.message);
        }
      };

      socket.onmessage = handleMessage;

      return () => {
        socket.onmessage = null;
      };
    } else {
      console.log("Socket is not connected");
    }
  }, [socket]);

  if (chat) {
    return socket ? <Navigate to={`/chat?roomId=${roomId}`} /> : <Navigate to="/" />;
  }

  return (
    <div className='bg-black h-screen'>
      <div className="justify-center items-center flex text-white">
        <h1 className='font-semibold text-7xl'>Chat with yo bitch todayyyyy!!!</h1>
      </div>
      <div className='flex justify-center text-white pt-96 gap-6'>
        <button
          className='bg-green-400 px-4 py-3 rounded-2xl text-2xl'
          onClick={() => {
            setUserId(true);
            setRoomId(null);
          }}
        >
          Join Room😘
        </button>
        {
            userId && (
                <div>
                    <input type='text' placeholder='Enter Room id' value={roomIdInput} onChange={(e)=>{
                        setRoomIdInput(e.target.value);
                    }} className='px-4 py-2 rounded text-xl'/>
                    <button className='' onClick={()=>{
                        socket?.send(JSON.stringify({
                            type:JOIN,
                            roomId:roomIdInput
                        }))
                    }}>
                        Join
                    </button>
                </div>
            )
            
        }
        
        <button
          className='bg-blue-400 px-4 py-3 rounded-2xl text-2xl'
          onClick={() => {
            socket?.send(
              JSON.stringify({
                type: "init_chat"
              })
            );
            setUserId(false);
          }}
        >
          Create Room🫂
        </button>
      </div>
      {roomId && (
        <div className='text-white text-2xl font-bold flex pt-4 justify-center items-center'>
          Share this room id w yo bitch <p className='bg-red-400 ml-2 px-2 rounded'>{roomId}</p>
        </div>
      )}
      </div>
  );
}

export default Land;
