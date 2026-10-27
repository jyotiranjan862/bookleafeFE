import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "./AuthContext";
import { useLocation } from "react-router-dom";
import type { Ticket, TicketMessage } from "../types";

export interface RealtimeToast {
  id: string;
  type: "ticket_created" | "message_received" | "status_updated";
  title: string;
  message: string;
  ticketId?: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  unreadTicketsCount: number;
  resetUnreadTicketsCount: () => void;
  realtimeToast: RealtimeToast | null;
  dismissToast: () => void;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  unreadTicketsCount: 0,
  resetUnreadTicketsCount: () => {},
  realtimeToast: null,
  dismissToast: () => {},
  joinTicket: () => {},
  leaveTicket: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [realtimeToast, setRealtimeToast] = useState<RealtimeToast | null>(null);

  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  // Clear unread count when admin navigates to /admin/queue
  useEffect(() => {
    if (location.pathname === "/admin/queue") {
      setUnreadTicketsCount(0);
    }
  }, [location.pathname]);

  const dismissToast = useCallback(() => {
    setRealtimeToast(null);
  }, []);

  const resetUnreadTicketsCount = useCallback(() => {
    setUnreadTicketsCount(0);
  }, []);

  const joinTicket = useCallback(
    (ticketId: string) => {
      if (socket && connected && ticketId) {
        socket.emit("JOIN_TICKET", { ticketId });
      }
    },
    [socket, connected]
  );

  const leaveTicket = useCallback(
    (ticketId: string) => {
      if (socket && connected && ticketId) {
        socket.emit("LEAVE_TICKET", { ticketId });
      }
    },
    [socket, connected]
  );

  // Initialize Socket.io connection on user login
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("accessToken");
    const serverUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const newSocket = io(serverUrl, {
      auth: { token: token || "" },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    // Handle global real-time notifications for admins
    newSocket.on("TICKET_CREATED", (payload: { ticket: Ticket }) => {
      const ticket = payload.ticket;
      const isAdmin = user.role === "admin" || user.role === "operations_executive";

      if (isAdmin) {
        // If admin is NOT on the queue page, increment unread counter
        if (locationRef.current !== "/admin/queue") {
          setUnreadTicketsCount((prev) => prev + 1);
        }

        // Show toast notification
        const authorName =
          typeof ticket.author === "object" ? (ticket.author as any)?.name : "An author";

        setRealtimeToast({
          id: `${ticket._id}-${Date.now()}`,
          type: "ticket_created",
          title: `New Ticket: ${ticket.ticketNumber}`,
          message: `${authorName || "Author"} submitted: "${ticket.subject}"`,
          ticketId: ticket._id,
        });

        setTimeout(() => {
          setRealtimeToast((current) => (current?.ticketId === ticket._id ? null : current));
        }, 6000);
      }
    });

    // Author direct notification when admin posts a reply
    newSocket.on("MESSAGE_RECEIVED", (payload: { ticketId: string; message: TicketMessage }) => {
      if (user.role === "author") {
        setRealtimeToast({
          id: `${payload.ticketId}-${Date.now()}`,
          type: "message_received",
          title: "New Support Response",
          message: payload.message?.body
            ? payload.message.body.slice(0, 80) + (payload.message.body.length > 80 ? "..." : "")
            : "The operations team sent you a response.",
          ticketId: payload.ticketId,
        });

        setTimeout(() => {
          setRealtimeToast((current) => (current?.ticketId === payload.ticketId ? null : current));
        }, 6000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        unreadTicketsCount,
        resetUnreadTicketsCount,
        realtimeToast,
        dismissToast,
        joinTicket,
        leaveTicket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
