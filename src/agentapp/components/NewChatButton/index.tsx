import React from 'react';
import styles from './index.module.css';

interface NewChatButtonProps {
  onClick: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <button
      className={styles.newChatButton}
      onClick={onClick}
    >
      <span className={styles.plusIcon}>+</span>
      <span className={styles.buttonText}>新建会话</span>
    </button>
  );
};

export default NewChatButton;
