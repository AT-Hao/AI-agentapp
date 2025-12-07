import  React,{useState} from 'react';
import  { Message } from '../../types/chat';
import styles from './index.module.css';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const renderSearchResults = (jsonString: string) => {
    try {
      // Tavily 的结果通常包含 results 数组
      const data = JSON.parse(jsonString);
      const results = data.results || [];

      if (!Array.isArray(results) || results.length === 0) {
        return <div>{jsonString}</div>; // 回退显示原始文本
      }

      return (
        <div>
          {results.map((result: any, index: number) => (
            <div key={index} className={styles.searchResultItem}>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className={styles.searchResultLink}>
                {index + 1}. {result.title}
              </a>
              <div>
                  {result.content}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <div>{jsonString}</div>;
    }
  };

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

        <div className={styles.content}>
          <ReactMarkdown
            components={{
              code(props) {
                const { children, className, node, ref, ...rest } = props;

                const match = /language-(\w+)/.exec(className || '');

                return match ? (
                  <div className={styles.codeBlockWrapper}>
                    <div className={styles.codeBlockHeader}>
                      <span className={styles.codeLang}>{match[1]}</span>
                    </div>
                    <SyntaxHighlighter
                      {...rest}
                      children={String(children).replace(/\n$/, '')}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderBottomLeftRadius: '8px',
                        borderBottomRightRadius: '8px',
                      }}
                    />
                  </div>
                ) : (
                  <code {...rest} className={styles.inlineCode} ref={ref}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.search_results && (
          <div className={styles.searchContainer}>
            <div
              className={styles.searchHeader}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <span className={styles.searchIcon}>🌏</span>
              <span className={styles.searchTitle}>搜索结果</span>
              <span className={styles.searchToggle}>
                {isSearchExpanded ? '收起' : '展开'}
              </span>
            </div>
            {isSearchExpanded && (
              <div className={styles.searchContent}>
                {renderSearchResults(message.search_results)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ChatMessage;
