import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getChatResponse } from './services/faqService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your FAQ assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const responseText = await getChatResponse(history, input);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: "Chat cleared. How else can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl h-[85vh] flex flex-col glass-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-zinc-900">FAQ Assistant</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-zinc-500">Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.role === 'user' ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-900 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    message.role === 'user' 
                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                      : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none shadow-sm'
                  }`}>
                    {message.text}
                    <div className={`text-[10px] mt-2 opacity-50 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center bg-white border border-zinc-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-sm text-zinc-400">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-zinc-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="w-full pl-4 pr-12 py-3 bg-zinc-100 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center mt-3">
            Press Enter to send. Powered by Gemini AI.
          </p>
        </form>
      </div>
    </div>
  );
}
