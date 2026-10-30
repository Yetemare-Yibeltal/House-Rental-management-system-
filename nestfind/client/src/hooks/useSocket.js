import { useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';

export const useSocket = () => useSocketContext();

// Subscribe to a socket event. The handler can change every render without resubscribing.
export const useSocketEvent = (event, handler) => {
  const { socket } = useSocketContext();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !event) return undefined;
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
};

export default useSocket;
