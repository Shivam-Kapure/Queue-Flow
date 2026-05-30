import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export const useStore = create((set, get) => ({
  // Authentication State
  token: localStorage.getItem('qf_token') || null,
  user: null,
  authLoading: false,
  authError: null,

  // Admin Queues State
  queues: [],
  queuesLoading: false,

  // Active Customer Waiting State
  activeMemberState: null, // { inQueue: boolean, position: number, estimatedWaitTime: number, queueId, slug }
  servedAlert: false, // toggled true when served

  // Socket Connection Instance
  socket: null,

  // Initialize Auth from localstorage
  initAuth: async () => {
    const token = get().token;
    if (!token) return;

    set({ authLoading: true });
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data.user, authLoading: false });
    } catch (err) {
      console.error('Session restore failed:', err);
      get().logout();
    }
  },

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('qf_token', token);
      set({ token, user, authLoading: false });
      return user;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      set({ authError: errorMsg, authLoading: false });
      throw new Error(errorMsg);
    }
  },

  register: async (name, email, password, role = 'USER') => {
    set({ authLoading: true, authError: null });
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      const { token, user } = res.data;

      localStorage.setItem('qf_token', token);
      set({ token, user, authLoading: false });
      return user;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      set({ authError: errorMsg, authLoading: false });
      throw new Error(errorMsg);
    }
  },

  logout: () => {
    localStorage.removeItem('qf_token');
    get().disconnectSocket();
    set({ token: null, user: null, activeMemberState: null, servedAlert: false });
  },

  // Admin Queue operations
  fetchQueues: async () => {
    const token = get().token;
    if (!token) return;

    set({ queuesLoading: true });
    try {
      const res = await axios.get(`${API_URL}/queues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ queues: res.data, queuesLoading: false });
    } catch (err) {
      set({ queuesLoading: false });
    }
  },

  createQueue: async (title, description, type, avgProcessingTime, rateLimit) => {
    const token = get().token;
    try {
      const res = await axios.post(
        `${API_URL}/queues`,
        { title, description, type, avgProcessingTime, rateLimit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({ queues: [res.data, ...state.queues] }));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create queue');
    }
  },

  serveNextUser: async (queueId) => {
    const token = get().token;
    try {
      const res = await axios.post(
        `${API_URL}/queues/${queueId}/serve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to serve next member');
    }
  },

  toggleQueueState: async (queueId, isActive) => {
    const token = get().token;
    try {
      const res = await axios.patch(
        `${API_URL}/queues/${queueId}/toggle`,
        { isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({
        queues: state.queues.map((q) => (q.id === queueId ? { ...q, isActive: res.data.isActive } : q))
      }));
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to toggle queue state');
    }
  },

  // Customer Queue Operations
  joinQueue: async (queueId, queueSlug, priority = 0, vipPasscode = '') => {
    const token = get().token;
    try {
      const res = await axios.post(
        `${API_URL}/members/${queueId}/join`,
        { priority, vipPasscode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { position, estimatedWaitTime } = res.data;

      set({
        activeMemberState: {
          inQueue: true,
          position,
          estimatedWaitTime,
          queueId,
          slug: queueSlug
        },
        servedAlert: false
      });

      // Bind Socket
      get().initSocketConnection(queueSlug);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to join queue');
    }
  },

  leaveQueue: async (queueId) => {
    const token = get().token;
    try {
      await axios.post(
        `${API_URL}/members/${queueId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      get().disconnectSocket();
      set({ activeMemberState: null });
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  },

  fetchMemberStatus: async (queueId, queueSlug) => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/members/${queueId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.inQueue) {
        set({
          activeMemberState: {
            inQueue: true,
            position: res.data.position,
            estimatedWaitTime: res.data.estimatedWaitTime,
            queueId,
            slug: queueSlug
          }
        });
        get().initSocketConnection(queueSlug);
      } else {
        set({ activeMemberState: null });
        if (res.data.lastStatus === 'SERVED') {
          set({ servedAlert: true });
        }
      }
    } catch (err) {
      console.error('Error fetching member status:', err);
    }
  },

  // Socket management
  initSocketConnection: (queueSlug) => {
    // If socket already active, reuse or rejoin
    let socket = get().socket;
    if (!socket) {
      socket = io(SOCKET_URL);
      set({ socket });
    }

    socket.emit('join_queue_room', { queueSlug });

    // Tick Listener (broad update of queue positions)
    socket.off('queue_tick');
    socket.on('queue_tick', ({ queueId }) => {
      const activeState = get().activeMemberState;
      if (activeState && activeState.queueId === queueId) {
        get().fetchMemberStatus(queueId, queueSlug);
      }
    });

    // Alert Listener (user served)
    socket.off('user_served');
    socket.on('user_served', ({ userId }) => {
      const user = get().user;
      if (user && user.id === userId) {
        set({
          activeMemberState: null,
          servedAlert: true
        });
        get().disconnectSocket();
      }
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    const activeState = get().activeMemberState;
    if (socket) {
      if (activeState?.slug) {
        socket.emit('leave_queue_room', { queueSlug: activeState.slug });
      }
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
