import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Constants from "expo-constants";
import { logger } from "@/utils/logger";

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;
let stompClient: Client | null = null;

export const connectWebSocket = (onConnect?: () => void) => {
  if (stompClient?.connected) {
    logger.wsConnect("Already connected");
    onConnect?.();
    return;
  }

  try {
    const socket = new SockJS(`${BASE_URL}/ws`);
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => logger.debug("STOMP: " + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      logger.wsConnect(`${BASE_URL}/ws`);
      onConnect?.();
    };

    stompClient.onDisconnect = () => {
      logger.wsDisconnect(`${BASE_URL}/ws`);
    };

    stompClient.onStompError = (frame) => {
      logger.wsError(frame);
    };

    stompClient.activate();
  } catch (error) {
    logger.wsError(error);
  }
};

export const disconnectWebSocket = () => {
  if (stompClient?.connected) {
    stompClient.deactivate();
    logger.wsDisconnect("WebSocket disconnected");
  }
};

export const subscribeToBuyer = (buyerId: string, callback: (message: any) => void) => {
  if (!stompClient?.connected) {
    logger.wsError("WebSocket not connected");
    return;
  }

  return stompClient.subscribe(`/topic/buyer/${buyerId}`, callback);
};

export const subscribeToSeller = (sellerId: string, callback: (message: any) => void) => {
  if (!stompClient?.connected) {
    logger.wsError("WebSocket not connected");
    return;
  }

  return stompClient.subscribe(`/topic/seller/${sellerId}`, callback);
};

export const subscribeToMessages = (userId: string, callback: (message: any) => void) => {
  if (!stompClient?.connected) {
    logger.wsError("WebSocket not connected for messages");
    return;
  }

  return stompClient.subscribe(`/topic/messages/${userId}`, callback);
};

export const subscribeChatToMessages = (userId: string, callback: (message: any) => void) => {
  if (!stompClient?.connected) {
    logger.wsError("WebSocket not connected for chat messages");
    return;
  }

  return stompClient.subscribe(`/topic/chat/${userId}`, callback);
};

export const sendChatMessage = async (message: {
  senderId: string;
  receiverId: string;
  content: string;
  productId?: number;
}) => {
  if (!stompClient?.connected) {
    throw new Error("WebSocket not connected");
  }

  try {
    stompClient.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(message),
    });
    logger.wsMessage("Chat message sent", message);
  } catch (error) {
    logger.wsError(error);
    throw error;
  }
};