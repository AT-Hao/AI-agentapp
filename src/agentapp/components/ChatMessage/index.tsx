import React from 'react';
import styles from './index.module.css';
import { Message } from '../../types/chat';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.avatar}>
        {message.role === 'user' ? (
          <span className={styles.avatarText}>U</span>
        ) : (
          <span className={styles.avatarText}>AI</span>
        )}
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <span className={styles.name}>
            {message.role === 'user' ? '你' : 'AI 助手'}
          </span>
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
        </div>
        <div className={styles.content}>{message.content}</div>
      </div>
    </div>
  );
};

export default ChatMessage;