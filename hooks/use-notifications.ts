import { create } from 'zustand';
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number; // in milliseconds, default 5000
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, newNotification.duration);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  }
}));

// Hook for easy usage
export const useNotifications = () => {
  const { addNotification, removeNotification, clearAll } = useNotificationStore();
  
  const showSuccess = (title: string, description?: string, duration?: number) => {
    addNotification({ type: 'success', title, description, duration });
  };
  
  const showError = (title: string, description?: string, duration?: number) => {
    addNotification({ type: 'error', title, description, duration });
  };
  
  const showInfo = (title: string, description?: string, duration?: number) => {
    addNotification({ type: 'info', title, description, duration });
  };
  
  const showWarning = (title: string, description?: string, duration?: number) => {
    addNotification({ type: 'warning', title, description, duration });
  };
  
  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification,
    clearAll
  };
};

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return CheckCircle2Icon;
    case 'error':
      return AlertCircleIcon;
    case 'info':
      return InfoIcon;
    case 'warning':
      return AlertCircleIcon;
    default:
      return InfoIcon;
  }
};