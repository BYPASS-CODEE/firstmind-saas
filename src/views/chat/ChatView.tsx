import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  Bot, 
  User as UserIcon,
  Image as ImageIcon,
  FlaskConical,
  CornerDownLeft
} from 'lucide-react';

interface ChatViewProps {
  navigate: (path: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

const SAMPLE_STARTERS_KEYS = [
  'chatStarterCyberpunk',
  'chatStarterPortrait',
  'chatStarterMacro',
  'chatStarterArch'
];

export const ChatView: React.FC<ChatViewProps> = ({ navigate }) => {
  const { user, isDevTest } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('firstmind_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('gemini-2.0-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getChatStatus().then(res => {
      if (res.chatModel) {
        setModelName(res.chatModel);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('firstmind_chat_messages', JSON.stringify(messages));
    } else {
      sessionStorage.removeItem('firstmind_chat_messages');
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setError(null);
    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        messages: newHistory.map(m => ({ role: m.role, content: m.content }))
      };

      const res = await api.sendChatMessage(payload);
      const assistantMsg: Message = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: res.message.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: res.model
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const msg = err.message || 'Failed to generate response.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;

    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const historyUpToUser = messages.slice(0, actualIndex + 1);

    setError(null);
    setMessages(historyUpToUser);
    setIsLoading(true);

    try {
      const payload = {
        messages: historyUpToUser.map(m => ({ role: m.role, content: m.content }))
      };

      const res = await api.sendChatMessage(payload);
      const assistantMsg: Message = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: res.message.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: res.model
      };

      setMessages([...historyUpToUser, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate response.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateImageFromPrompt = (content: string) => {
    let cleanPrompt = content.trim();
    
    const promptMatch = content.match(/["""]([^""""]{20,})["""]/) || content.match(/Prompt:\s*([^\n\r]+)/i);
    if (promptMatch && promptMatch[1]) {
      cleanPrompt = promptMatch[1].trim();
    } else {
      const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
      if (paragraphs.length > 0) {
        cleanPrompt = paragraphs[0].replace(/^#+\s*/, '').replace(/^\*\*.*\*\*:?\s*/, '').trim();
      }
    }

    sessionStorage.setItem('firstmind_transfer_prompt', cleanPrompt);
    navigate('/app/studio');
  };

  const handleClear = () => {
    setMessages([]);
    sessionStorage.removeItem('firstmind_chat_messages');
    setError(null);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-5xl mx-auto px-4 sm:px-6 py-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('chatHeaderTitle')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {modelName}
              </span>
              {isDevTest && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" />
                  {t('chatDevTestMode')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t('chatHeaderDesc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('chatRegenerate')}</span>
              </button>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('chatClear')}</span>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/app/studio')}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t('chatImageStudio')}</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {t('chatEmptyTitle')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('chatEmptyDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl text-left">
              {SAMPLE_STARTERS_KEYS.map((key, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(t(key))}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 transition flex items-start justify-between gap-2 cursor-pointer shadow-2xs group"
                >
                  <span className="line-clamp-2">{t(key)}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 mt-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-br-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-3">
                    <div className="prose dark:prose-invert prose-xs max-w-none break-words">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                      <span className="font-mono">{msg.timestamp}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">{t('chatCopied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t('chatCopy')}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleCreateImageFromPrompt(msg.content)}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition"
                          title={t('chatTransferPrompt')}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>{t('chatCreateImageFromPrompt')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-xs p-4 text-xs text-zinc-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] font-mono">{t('chatThinking')} {modelName}...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{t('chatGenerationInterrupted')}</p>
              <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer text-xs"
            >
              {t('chatDismiss')}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="relative rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600 focus-within:border-transparent transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={t('chatInputPlaceholder')}
            rows={3}
            className="w-full resize-none p-3 pb-10 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />

          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 hidden sm:inline-flex items-center gap-1 font-mono">
              <CornerDownLeft className="w-3 h-3" /> {t('chatEnterToSend')}
            </span>
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('chatSend')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
