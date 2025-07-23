// services/websocket.ts
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Constants from "expo-constants";
import { logger } from "@/utils/logger";

let stompClient: Client | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const WS_URL = `http://192.168.1.27:8081/ws`;

/**
 * Connect to WebSocket server using SockJS and STOMP
 */
export const connectWebSocket = (onReady: () => void, onError?: () => void) => {
  // Disconnect existing connection if any
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
  }
  
  const socket = new SockJS(WS_URL);
  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: (str) => logger.debug("WebSocket Debug", str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      logger.wsConnect(WS_URL);
      reconnectAttempts = 0;
      onReady(); // trigger subscriptions
    },
    onDisconnect: () => {
      logger.wsDisconnect(WS_URL);
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(() => {
          if (stompClient && !stompClient.connected) {
            reconnectAttempts++;
            logger.info(`Attempting to reconnect WebSocket... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            stompClient.activate();
          }
        }, delay);
      } else {
        logger.error("Max reconnection attempts reached");
        onError?.();
      }
    },
    onStompError: (frame) => {
      logger.wsError(frame);
      onError?.();
    },
    onWebSocketError: (error) => {
      logger.wsError(error);
      onError?.();
    },
  });

  stompClient.activate();
};

/**
 * Subscribe to incoming messages for a user (chat messages)
 */
export const subscribeToMessages = (
  userId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) return;
  const topic = `/topic/messages/${userId}`;
  logger.info("Subscribing to messages topic", { topic, userId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Subscribe to chat messages (duplicate safe)
 */
export const subscribeChatToMessages = (
  userId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) return;
  const topic = `/topic/messages/${userId}`;
  logger.info("Subscribing to messages topic", { topic, userId });
  stompClient.subscribe(topic, (msg: IMessage) => {
    onMessage(msg);
  });
};

/**
 * Subscribe to seller topic
 */
export const subscribeToSeller = (
  sellerId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) return;
  const topic = `/topic/requests/${sellerId}`;
  logger.info("Subscribing to seller topic", { topic, sellerId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Subscribe to buyer topic
 */
export const subscribeToBuyer = (
  buyerId: string,
  onMessage: (msg: IMessage) => void
) => {
  if (!stompClient?.connected) return;
  const topic = `/topic/request-status/${buyerId}`;
  logger.info("Subscribing to buyer topic", { topic, buyerId });
  stompClient.subscribe(topic, onMessage);
};

/**
 * Disconnect WebSocket client
 */
export const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    logger.wsDisconnect(WS_URL);
    stompClient.deactivate();
  }
  stompClient = null;
  reconnectAttempts = 0;
};

/**
 * Send chat message to destination via STOMP
 */
export const sendChatMessage = (chatMessage: {
  senderId: string;
  receiverId: string;
  content: string;
  product: { id: number };
}) => {
  if (!stompClient?.connected) {
    logger.warn("WebSocket not connected, cannot subscribe to messages");
    throw new Error("WebSocket not connected");
    return;
  }
  }

  const destination = "/app/chat.send";

  stompClient.publish({
    destination,
  if (!stompClient?.connected) {
    logger.warn("WebSocket not connected, cannot subscribe to seller");
    return;
  }
/**
 * Check if WebSocket is connected
 */
export const isWebSocketConnected = (): boolean => {
  return stompClient?.connected || false;
};
  });

  logger.info("Chat message sent", { destination, chatMessage });
};

  if (!stompClient?.connected) {
    logger.warn("WebSocket not connected, cannot subscribe to buyer");
    return;
  }