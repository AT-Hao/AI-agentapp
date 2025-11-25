import React, { useRef, useEffect } from 'react';
import styles from './index.module.css';
import ChatMessage from '../ChatMessage';
import InputArea from '../InputArea';
import { Message } from '../../types/chat';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (content: string) => void;
  conversationTitle?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  conversationTitle = '新会话',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <h2 className={styles.chatTitle}>{conversationTitle}</h2>
      </div>
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyIcon}>💬</div>
            <h3 className={styles.emptyTitle}>开始聊天吧</h3>
            <p className={styles.emptySubtitle}>
              输入你的问题
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {isLoading && (
          <div className={styles.loadingMessage}>
            <div className={styles.spinner}></div>
            <span>请等待...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <InputArea onSend={onSendMessage} isLoading={isLoading} />
        </div>
        <div className={styles.footerHint}>
          <span>对话模型v1</span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
