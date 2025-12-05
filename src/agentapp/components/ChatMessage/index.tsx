import  React,{useState} from 'react';
import  { Message } from '../../types/chat';
import styles from './index.module.css';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

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
        {message.reasoning_content && (
          <div className={styles.reasoningContainer}>
            <div className={styles.reasoningHeader}
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}>
                <span className={styles.reasoningIcon}>💭</span>
                <span className={styles.reasoningTitle}>深度思考过程</span>
                <span className={styles.reasoningToggle}>
                  {isThinkingExpanded?'收起':'展开'}
                </span>
            </div>
            {isThinkingExpanded && (
              <div className={styles.reasoningContent}>
                {message.reasoning_content}
              </div>
            )}
          </div>
        )}



        <div className={styles.content}><ReactMarkdown>{message.content}</ReactMarkdown></div>
      </div>
    </div>
  );
};

export default ChatMessage;
