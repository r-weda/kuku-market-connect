import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';

export default function ChatsPage() {
  const navigate = useNavigate();
  const { conversations } = useApp();

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">Messages</h1>
      </header>

      <div className="divide-y divide-border">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-muted-foreground text-center">No conversations yet</p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Start chatting with sellers to negotiate deals
            </p>
          </div>
        ) : (
          conversations.map((conv, index) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full p-4 flex gap-3 text-left hover:bg-muted/50 active:bg-muted transition-colors"
              onClick={() => navigate(`/chat/${conv.listing.id}`)}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={conv.listing.images[0]}
                  alt={conv.listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate">{conv.otherUser.name}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(conv.lastMessage.timestamp), 'MMM d')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.listing.title}
                </p>
                <p className={`text-sm truncate mt-1 ${conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {conv.lastMessage.senderId === 'current-user' && 'You: '}
                  {conv.lastMessage.message}
                </p>
              </div>
              
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center shrink-0 self-center">
                  {conv.unreadCount}
                </div>
              )}
            </motion.button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
