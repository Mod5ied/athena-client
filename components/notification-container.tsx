'use client';

import { useNotificationStore, getNotificationIcon } from '@/hooks/use-notifications';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md space-y-2">
      {notifications.map((notification) => {
        const IconComponent = getNotificationIcon(notification.type);
        
        return (
          <Alert
            key={notification.id}
            variant={notification.type === 'error' ? 'destructive' : 'default'}
            className={`relative pr-12 shadow-lg animate-in slide-in-from-top-2 ${
              notification.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''
            }`}
          >
            <IconComponent className={`h-4 w-4 ${
              notification.type === 'success' ? 'text-green-600' : 
              notification.type === 'warning' ? 'text-yellow-600' : ''
            }`} />
            <AlertTitle>{notification.title}</AlertTitle>
            {notification.description && (
              <AlertDescription>{notification.description}</AlertDescription>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        );
      })}
    </div>
  );
}