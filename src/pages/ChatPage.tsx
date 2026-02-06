import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone, MoreVertical } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { listings } = useApp();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'seller',
      text: 'Hello! Yes, the chickens are still available.',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      senderId: 'current-user',
      text: 'Great! What is the average weight?',
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      id: '3',
      senderId: 'seller',
      text: 'Each bird weighs about 2-2.5kg. They are very healthy and well-fed.',
      timestamp: new Date(Date.now() - 2400000),
    },
  ]);

  const listing = listings.find((l) => l.id === listingId);

  const sellerName = listing?.seller?.name || 'Seller';
  const sellerInitial = sellerName.charAt(0);
  const listingTitle = listing?.title || 'Listing';
  const listingImage = listing?.images?.[0] || '/placeholder.svg';
  const listingPrice = listing?.pricePerUnit;

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        senderId: 'current-user',
        text: message,
        timestamp: new Date(),
      },
    ]);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {sellerInitial}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{sellerName}</h2>
              <p className="text-xs text-muted-foreground truncate">{listingTitle}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Listing Preview */}
        {listing && (
          <button 
            className="w-full flex items-center gap-3 px-4 py-2 bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => navigate(`/listing/${listing.id}`)}
          >
            <img 
              src={listingImage} 
              alt={listingTitle}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium truncate">{listingTitle}</p>
              {listingPrice && (
                <p className="text-sm text-primary font-bold">
                  KES {listingPrice.toLocaleString()}/bird
                </p>
              )}
            </div>
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.senderId === 'current-user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border rounded-bl-md'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${
                msg.senderId === 'current-user' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 safe-bottom">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-muted border-0"
          />
          <Button size="icon" onClick={handleSend} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
