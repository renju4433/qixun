import qixunAvatar from '@/components/User/qixunAvatar';
import { deleteComment, listComment, postComment, searchUser } from '@/services/api';
import { Link } from '@umijs/max';
import { Avatar, Button, Flex, List, message, Popconfirm, Segmented } from 'antd';
import moment from 'moment';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.less';

interface InteractCommentProps {
  postId: number;
  userId?: number;
}

type CommentSortOrder = 'newest' | 'earliest';

const InteractComment: FC<InteractCommentProps> = ({ postId, userId }) => {
  const [commentData, setCommentData] = useState<API.CommentParams[]>([]);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('earliest');
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<API.UserProfile[]>([]);
  const [mentionDropdownVisible, setMentionDropdownVisible] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (time: number) => {
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('MM-DD')
      : moment(time).format('YYYY-MM-DD');
  };

  const loadComments = async () => {
    const res = await listComment({ postId: postId });
    if (res.success && res.data) {
      setCommentData(res.data.commentList || []);
    } else if (res.success === false) {
      message.error('评论加载失败，请检查网络或联系管理员');
    }
  };

  useEffect(() => {
    void loadComments();
  }, [postId]);

  const sortedCommentData = useMemo(() => {
    return [...commentData].sort((a, b) =>
      sortOrder === 'newest'
        ? (b.gmtCreate ?? 0) - (a.gmtCreate ?? 0)
        : (a.gmtCreate ?? 0) - (b.gmtCreate ?? 0),
    );
  }, [commentData, sortOrder]);

  const searchUsers = (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setMentionDropdownVisible(false);
      return;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchUser({
          keyword: keyword.trim(),
          pageNum: 1,
          pageSize: 10,
        });
        if (res.success && res.data) {
          setSearchResults(res.data.filter((user) => !!user.userName));
        }
      } catch (error) {
        setSearchResults([]);
      }
    }, 300);
  };

  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    const caretPos = getCaretPosition();
    const beforeCaret = text.slice(0, caretPos);
    const lastAtIndex = beforeCaret.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const afterAt = beforeCaret.slice(lastAtIndex + 1);
      if (/^\S*$/.test(afterAt)) {
        setMentionDropdownVisible(true);
        searchUsers(afterAt);
        return;
      }
    }
    setMentionDropdownVisible(false);
  };

  const createMentionSpan = (userIdValue: number, userName: string) => {
    const span = document.createElement('span');
    span.className = styles.mentionTag;
    span.contentEditable = 'false';
    span.setAttribute('data-user-id', String(userIdValue));
    span.setAttribute('data-user-name', userName);
    span.textContent = `@${userName}`;
    return span;
  };

  const closeMentionDropdown = () => {
    setMentionDropdownVisible(false);
    setSearchResults([]);
  };

  const insertMentionAtEnd = (userIdValue: number, userName: string) => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('br, div:empty').forEach((el) => el.remove());

    const mentionSpan = createMentionSpan(userIdValue, userName);
    const spaceNode = document.createTextNode(' ');

    const lastChild = editorRef.current.lastChild;
    if (
      lastChild &&
      lastChild.nodeType === Node.TEXT_NODE &&
      lastChild.textContent &&
      !lastChild.textContent.endsWith(' ')
    ) {
      editorRef.current.appendChild(document.createTextNode(' '));
    }

    editorRef.current.appendChild(mentionSpan);
    editorRef.current.appendChild(spaceNode);

    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    closeMentionDropdown();
  };

  const selectUser = (user: API.UserProfile) => {
    if (!editorRef.current || !user.userName || user.userId === undefined) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      insertMentionAtEnd(user.userId, user.userName);
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    if (container.nodeType === Node.TEXT_NODE && container.textContent) {
      const textContent = container.textContent;
      const cursorOffset = range.startOffset;
      let atIndex = -1;
      for (let i = cursorOffset - 1; i >= 0; i -= 1) {
        if (textContent[i] === '@') {
          atIndex = i;
          break;
        }
        if (/\s/.test(textContent[i])) break;
      }

      if (atIndex !== -1) {
        const beforeAt = textContent.slice(0, atIndex);
        const afterCursor = textContent.slice(cursorOffset);
        const parent = container.parentNode;
        if (!parent) return;

        const mentionSpan = createMentionSpan(user.userId, user.userName);
        const spaceNode = document.createTextNode(' ');

        if (beforeAt) parent.insertBefore(document.createTextNode(beforeAt), container);
        parent.insertBefore(mentionSpan, container);
        parent.insertBefore(spaceNode, container);
        if (afterCursor) parent.insertBefore(document.createTextNode(afterCursor), container);
        parent.removeChild(container);

        const newRange = document.createRange();
        newRange.setStartAfter(spaceNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        closeMentionDropdown();
        return;
      }
    }
    insertMentionAtEnd(user.userId, user.userName);
  };

  const extractContentAndMentions = (): { text: string; mentions: API.MentionItem[] } => {
    if (!editorRef.current) return { text: '', mentions: [] };
    const mentions: API.MentionItem[] = [];
    let text = '';
    let currentPos = 0;

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent || '';
        text += content;
        currentPos += content.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.classList.contains(styles.mentionTag)) {
          const userIdValue = element.getAttribute('data-user-id');
          const userName = element.getAttribute('data-user-name') || '';
          const mentionText = `@${userName}`;
          mentions.push({
            user_id: Number(userIdValue),
            display: userName,
            start: currentPos,
            end: currentPos + mentionText.length,
          });
          text += mentionText;
          currentPos += mentionText.length;
        } else {
          node.childNodes.forEach((child) => processNode(child));
        }
      }
    };
    editorRef.current.childNodes.forEach((child) => processNode(child));
    return { text: text.trim(), mentions };
  };

  const handleSubmitComment = async () => {
    const { text, mentions } = extractContentAndMentions();
    if (!text) {
      message.error('请输入你的评论');
      return;
    }
    setPostingComment(true);
    try {
      const res = await postComment({
        postId,
        commentText: text,
        mentions: mentions.length ? mentions : undefined,
        id: 0,
        userId: 0,
      });
      if (res.success) {
        message.success('发布成功');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        loadComments();
      } else {
        message.error('评论发布失败，请检查网络或联系管理员');
      }
    } finally {
      setPostingComment(false);
      closeMentionDropdown();
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const res = await deleteComment({ commentId: commentId });
    if (res.success) {
      setCommentData(commentData.filter((item: API.CommentParams) => item.id !== commentId));
      message.success('评论删除成功');
    } else {
      message.error('评论删除失败，请检查网络或联系管理员');
    }
  };

  const insertPlainText = (text: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    insertPlainText(e.clipboardData.getData('text/plain'));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) insertPlainText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    } else if (e.key === 'Escape') {
      closeMentionDropdown();
    }
  };

  const renderCommentText = (
    text: string | null,
    mentions?: API.MentionItem[],
  ): React.ReactNode => {
    if (!text) return null;
    if (!mentions || mentions.length === 0) return text;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    [...mentions]
      .sort((a, b) => a.start - b.start)
      .forEach((mention, index) => {
        if (mention.start > lastIndex) {
          parts.push(text.slice(lastIndex, mention.start));
        }
        parts.push(
          <span
            key={`mention-${index}`}
            className={styles.mentionHighlight}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              window.open(`/user/${mention.user_id}`, '_blank');
            }}
          >
            {text.slice(mention.start, mention.end)}
          </span>,
        );
        lastIndex = mention.end;
      });
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const renderCommentList = () => (
    <List
      dataSource={sortedCommentData}
      renderItem={(item) => (
        <List.Item
          key={item.id}
          actions={
            [
              <Button
                type="link"
                key="reply"
                style={{ padding: 0 }}
                onClick={() => insertMentionAtEnd(item.user.userId, item.user.userName)}
              >
                回复
              </Button>,
              ...(item.user.userId === userId
                ? [
                  <Popconfirm
                    key="delete"
                    title="确认删除该评论？"
                    onConfirm={() => handleDeleteComment(item.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button danger type="text" style={{ padding: 0 }}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]
                : []),
            ]
          }
        >
          <Flex align="start" gap="small" style={{ width: '100%' }}>
            <Link
              to={`/user/${item.user.userId}`}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <qixunAvatar user={item.user} size={40} />
            </Link>
            <div style={{ width: '100%', wordBreak: 'break-all' }}>
              {/*用户信息、评论时间左右分布*/}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                {/*用户信息*/}
                <Link
                  style={{ fontWeight: 'bold', color: '#dcdcdc' }}
                  to={`/user/${item.user.userId}`}
                >
                  {item.user.userName}
                </Link>

                {/*评论时间*/}
                <span style={{ color: 'gray' }}>
                  {formatTime(item.gmtCreate)}
                </span>
              </div>
              <pre
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                {renderCommentText(item.commentText, item.mentions)}
              </pre>
            </div>
          </Flex>
        </List.Item>
      )}
    />
  );

  return (
    <Flex vertical>
      <div className={styles.commentForm}>
        <div className={styles.editorContainer}>
          <div
            ref={editorRef}
            className={styles.commentEditor}
            contentEditable
            data-placeholder="写下你的评论和分析吧，输入@可以提及用户"
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
          />
          {mentionDropdownVisible && searchResults.length > 0 && (
            <div
              className={styles.mentionPopup}
              onMouseDown={(event) => event.preventDefault()}
            >
              {searchResults.slice(0, 10).map((user) => (
                <div
                  key={user.userId}
                  className={styles.mentionUserItem}
                  onClick={() => selectUser(user)}
                >
                  <Avatar
                    size={32}
                    src={
                      user.icon
                        ? `https://b68v.daai.fun/${user.icon}?x-oss-process=image/resize,h_60`
                        : undefined
                    }
                  />
                  <span className={styles.mentionUserName}>{user.userName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          type="primary"
          onClick={handleSubmitComment}
          loading={postingComment}
          disabled={postingComment}
        >
          发布评论
        </Button>
      </div>
      {commentData.length > 0 && (
        <Flex justify="flex-start" style={{ marginBottom: 16 }}>
          <Segmented
            value={sortOrder}
            onChange={(v) => setSortOrder(v as CommentSortOrder)}
            options={[
              { label: '最早', value: 'earliest' },
              { label: '最新', value: 'newest' },
            ]}
          />
        </Flex>
      )}
      {commentData.length ? renderCommentList() : null}
    </Flex>
  );
};

export default InteractComment;
