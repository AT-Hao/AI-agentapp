import React, { useState, useRef, useEffect } from 'react';
import styles from './index.module.css';

interface InputAreaProps {
  onSend: (content: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSend(content);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputForm}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="在这里输入消息... "
        disabled={isLoading}
        className={styles.textarea}
      />
      <button
        type="submit"
        className={styles.sendButton}
        disabled={!content.trim() || isLoading}
      >
        {isLoading ? '发送中...' : '发送'}
      </button>
    </form>
  );
};

export default InputArea;
