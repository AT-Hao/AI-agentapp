import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatWindow from './components/ChatWindow';
import { useChat } from './hooks/useChat';
import { useWindowSize } from './hooks/useWindowSize';

const App: React.FC = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 从 useChat() 获取正确的返回值
  const {
    conversations,
    activeConversation,
    isLoading,
    error,
    sendMessage,
    createNewConversation,
    deleteConversation,
    setActiveConversationId,
  } = useChat();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onSelectConversation={setActiveConversationId}
        onDeleteConversation={deleteConversation}
        onCreateNewChat={createNewConversation}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Topbar
          isMobile={isMobile}
          onToggleSidebar={toggleSidebar}
        />

        <div className="chat-container">
          {activeConversation ? (
            <ChatWindow
              messages={activeConversation.messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={sendMessage}
              conversationTitle={activeConversation.title}
            />
          ) : (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
