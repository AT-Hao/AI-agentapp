import type React from 'react';
import type { Conversation } from '../../types/chat';
import NewChatButton from '../NewChatButton';
import styles from './index.module.css';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onCreateNewChat: () => void;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onCreateNewChat,
  isOpen,
  isMobile,
  onClose,
}) => {
  if (isMobile && !isOpen) return null;

  return (
    <div
      className={`${styles.sidebar} ${isMobile ? styles.mobile : ''} ${isOpen ? styles.open : ''}`}
    >
      {isMobile && (
        <div className={styles.mobileHeader}>
          <h2 className={styles.mobileTitle}>会话列表</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      )}
      <div className={styles.sidebarContent}>
        <NewChatButton onClick={onCreateNewChat} />
        <div className={styles.conversationsList}>
          <h3 className={styles.sectionTitle}>最近会话</h3>
          {conversations.length === 0 ? (
            <div className={styles.emptyState}>暂无会话</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  conv.id === activeConversationId ? styles.active : ''
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationTitle}>{conv.title}</div>
                  <div className={styles.conversationDate}>
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  aria-label="删除会话"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
