import { CFBizUri } from '@/constants';
import { history } from '@@/core/history';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Flex } from 'antd';
const { Meta } = Card;

type MapCardProps = {
  map: API.MapItem;
};

const MapCard: React.FC<MapCardProps> = ({ map }) => (
  <Card
    hoverable
    onClick={() => history.push(`/map/${map!.id}`)}
    size="small"
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.03)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    }}
    style={{
      overflow: 'hidden',
      border: '1px solid gray',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
    }}
    cover={
      <img
        src={`${CFBizUri}${
          map.cover ?? 'biz/1659323781589_7d19c33667a54a4dabb0405ee5aec20f.jpeg'
        }?x-oss-process=image/resize,h_360`}
        style={{ height: 120, objectFit: 'cover' }}
      />
    }
  >
    <Meta
      title={map.name}
      description={
        <Flex justify="space-between">
          <span>
            <UserOutlined /> {map.players}
          </span>
          <span>
            <EnvironmentOutlined /> {map.pcount}
          </span>
        </Flex>
      }
    />
  </Card>
);

export default MapCard;
