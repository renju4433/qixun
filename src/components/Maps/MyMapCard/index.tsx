import { CFBizUri } from '@/constants';
import { history } from '@@/core/history';
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  SendOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Image, Popconfirm } from 'antd';
import { FC } from 'react';
import styles from './style.less';

interface MyMapCardProps {
  map: API.MapItem;
  onPublish?: (mapId: number) => void;
  onUnpublish?: (mapId: number) => void;
  onDelete?: (mapId: number) => void;
}

const MyMapCard: FC<MyMapCardProps> = ({
  map,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const coverUrl = `${CFBizUri}${
    map.cover ?? 'biz/1659323781589_7d19c33667a54a4dabb0405ee5aec20f.jpeg'
  }?x-oss-process=image/resize,w_400`;

  return (
    <div className={styles.card}>
      {/* 封面图片 */}
      <div
        className={styles.coverWrapper}
        onClick={() => history.push('/map/' + map.id)}
      >
        <Image
          preview={false}
          className={styles.coverImage}
          src={coverUrl}
          alt={map.name}
          placeholder={<div className={styles.imagePlaceholder} />}
        />
        {/* 发布状态标签 */}
        {map.publish ? (
          <div className={styles.publishedBadge}>已发布</div>
        ) : (
          <div className={styles.draftBadge}>草稿</div>
        )}
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        {/* 标题 */}
        <div
          className={styles.title}
          onClick={() => history.push('/map/' + map.id)}
        >
          {map.name}
        </div>

        {/* 统计信息 */}
        <div className={styles.stats}>
          <span>
            <EnvironmentOutlined /> {map.pcount ?? 0}
          </span>
          <span>
            <UserOutlined /> {map.players}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => history.push('/map/' + map.id)}
          >
            访问
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => history.push('/mapmodify/' + map.id)}
          >
            编辑
          </Button>
          {!map.publish && onPublish && (
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => onPublish(map.id)}
            >
              发布
            </Button>
          )}
          {map.publish && onUnpublish && (
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={() => onUnpublish(map.id)}
            >
              撤回
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="确认删除吗？"
              onConfirm={() => onDelete(map.id)}
            >
              <Button size="small" danger ghost icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMapCard;
