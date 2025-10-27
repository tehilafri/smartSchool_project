import { updateTeacher, updateStudent, addEvent, updateEvent, removeEvent } from '../slices/schoolDataSlice';
import { addExternalSubstituteOptimistic, updateExternalSubstituteOptimistic, removeExternalSubstituteOptimistic } from '../slices/substituteSlice';

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(dispatch) {
    try {
      this.ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:5000');
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data, dispatch);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect(dispatch);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  handleMessage(data, dispatch) {
    const { type, payload } = data;
    
    switch (type) {
      case 'TEACHER_UPDATED':
        dispatch(updateTeacher(payload));
        break;
      case 'STUDENT_UPDATED':
        dispatch(updateStudent(payload));
        break;
      case 'EVENT_ADDED':
        dispatch(addEvent(payload));
        break;
      case 'EVENT_UPDATED':
        dispatch(updateEvent(payload));
        break;
      case 'EVENT_REMOVED':
        dispatch(removeEvent(payload.id));
        break;
      case 'SUBSTITUTE_ADDED':
        dispatch(addExternalSubstituteOptimistic(payload));
        break;
      case 'SUBSTITUTE_UPDATED':
        dispatch(updateExternalSubstituteOptimistic(payload));
        break;
      case 'SUBSTITUTE_REMOVED':
        dispatch(removeExternalSubstituteOptimistic(payload.identityNumber));
        break;
    }
  }

  reconnect(dispatch) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(dispatch);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const wsManager = new WebSocketManager();

export const websocketMiddleware = (store) => (next) => (action) => {
  if (action.type === 'websocket/connect') {
    wsManager.connect(store.dispatch);
  } else if (action.type === 'websocket/disconnect') {
    wsManager.disconnect();
  }
  
  return next(action);
};

export const connectWebSocket = () => ({ type: 'websocket/connect' });
export const disconnectWebSocket = () => ({ type: 'websocket/disconnect' });