import { useNavigate } from 'react-router-dom';
import { X, Archive } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';
import { useNotificationStore } from '../../context/NotificationContext';

const PRIORITY = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  normal: 'border-l-yellow-500',
  low: 'border-l-gray-500',
};

const NotificationItem = ({ notification, showActions = true }) => {
  const { _id, title, message, isRead, actionUrl, priority, createdAt, metadata } = notification;
  const { markAsRead, deleteNotification, archiveNotification } = useNotificationStore();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isRead) markAsRead(_id);
    if (actionUrl) navigate(actionUrl);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex gap-3 p-4 border-l-4 transition-colors cursor-pointer group hover:bg-surface-light ${PRIORITY[priority] || PRIORITY.normal} ${isRead ? 'bg-surface-card/50' : 'bg-surface-card'}`}
    >
      <div className="flex-shrink-0 text-xl">{metadata?.icon || '🔔'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${isRead ? 'text-gray-300' : 'text-white'}`}>{title}</p>
          {!isRead && <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{message}</p>
        <p className="text-[10px] text-gray-500 mt-1.5">{formatTimeAgo(createdAt)}</p>
      </div>
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); archiveNotification(_id); }} className="w-6 h-6 rounded bg-surface-border flex items-center justify-center text-gray-400 hover:text-yellow-400" title="Archive">
            <Archive size={11} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteNotification(_id); }} className="w-6 h-6 rounded bg-surface-border flex items-center justify-center text-gray-400 hover:text-red-400" title="Delete">
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
