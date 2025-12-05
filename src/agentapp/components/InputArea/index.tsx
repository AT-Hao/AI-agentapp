import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './index.module.css';

interface InputAreaProps {
  onSend: (content: string, enableThinking: boolean,enableSearch:boolean) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [content, setContent] = useState('');
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本域高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSend(content,isThinkingEnabled,isSearchEnabled);
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

      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="在这里输入消息... "
          disabled={isLoading}
          className={styles.textarea}
        />
        <div className={styles.sendIcon}>

          <button type="button" className={`${isThinkingEnabled ? styles.thinkingButtonClicked : styles.thinkingButton}`} onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}>
            {isThinkingEnabled ? '关闭思考 🧠' : '开启思考 🧠'}
          </button>
          <button
            type="button"
            className={isSearchEnabled ? styles.toggleButtonClicked : styles.toggleButton}
            onClick={() => setIsSearchEnabled(!isSearchEnabled)}
          >
            {isSearchEnabled ? '关闭联网 🌏' : '开启联网 🌏'}
          </button>
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!content.trim() || isLoading}
          >
            {'⮝'}
          </button>
        </div>

      </div>

    </form>
  );
};

export default InputArea;
