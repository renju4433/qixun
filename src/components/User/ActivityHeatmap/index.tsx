import { getUserDailyActivity } from '@/services/api';
import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

interface Props {
  userId: number;
}

const ActivityHeatmap: React.FC<Props> = ({ userId }) => {
  const [activity, setActivity] = useState<API.UserActivity[]>([]);
  const [maxCount, setMaxCount] = useState<number>(0);

  useEffect(() => {
    getUserDailyActivity({ userId }).then((res) => {
      if (res.success && res.data) {
        setActivity(res.data);
        setMaxCount(Math.max(...res.data.map((data) => data.count)));
      }
    });
  }, [userId]);

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 18, fontWeight: 'bold' }}>
        活跃度
      </div>
      <CalendarHeatmap
        monthLabels={[
          '一月',
          '二月',
          '三月',
          '四月',
          '五月',
          '六月',
          '七月',
          '八月',
          '九月',
          '十月',
          '十一月',
          '十二月',
        ]}
        startDate={
          new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        }
        classForValue={(value) => {
          if (!value) return `color-github-0`;
          if (value.count < maxCount / 4.0) return `color-github-1`;
          else if (value.count < maxCount / 2.0) return `color-github-2`;
          else if (value.count < (maxCount / 4.0) * 3.0)
            return `color-github-3`;
          else return `color-github-4`;
        }}
        endDate={new Date()}
        values={activity ?? []}
        showWeekdayLabels={true}
        weekdayLabels={['周日', '周一', '周二', '周三', '周四', '周五', '周六']}
      />
    </div>
  );
};

export default ActivityHeatmap;
