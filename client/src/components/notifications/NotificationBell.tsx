import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Bell,
  CheckCheck,
  Trash2,
  BookOpen,
  Award,
  RotateCcw,
  Calendar,
  Clock,
  Megaphone,
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import type { INotification, NotificationType } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=25');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Ignore background errors
    }
  };

  const handleMarkAsRead = async (notification: INotification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Ignore
      }
    }

    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true);
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ASSIGNMENT_CREATED':
        return <BookOpen className="h-4 w-4 text-indigo-400" />;
      case 'ASSIGNMENT_GRADED':
        return <Award className="h-4 w-4 text-emerald-400" />;
      case 'ASSIGNMENT_RETURNED':
        return <RotateCcw className="h-4 w-4 text-amber-400" />;
      case 'SESSION_SCHEDULED':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'SESSION_UPDATED':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'ANNOUNCEMENT_PUBLISHED':
        return <Megaphone className="h-4 w-4 text-violet-400" />;
      case 'TEST_AVAILABLE':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'TEST_GRADED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-premium z-50 animate-enter overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 p-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-all"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-xs">No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-secondary/40 ${
                    !n.read ? 'bg-primary/5 border-l-2 border-l-primary' : 'bg-transparent'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-secondary border border-border shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold line-clamp-1 ${
                          !n.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {n.link && (
                      <div className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-1">
                        <span>View details</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
