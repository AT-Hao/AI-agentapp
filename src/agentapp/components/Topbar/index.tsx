import type React from 'react';
import styles from './index.module.css';

interface TopbarProps {
  isMobile: boolean;
  onToggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ isMobile, onToggleSidebar }) => {
  return (
    <div className={styles.topbar}>
      {isMobile && (
        <button
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="切换菜单"
        >
          ☰
        </button>
      )}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🤖</span>
        <h1 className={styles.logoText}>AI 聊天助手</h1>
      </div>
      <div className={styles.actions}>
        {/* <button className={styles.settingsButton} aria-label="设置">
          ⚙️
        </button> */}
      </div>
    </div>
  );
};

export default Topbar;
