import { publicPath } from '@/constants';
import { checkVipState } from '@/services/api';
import { secondsToMinutesAndSeconds } from '@/services/extend';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { BiMoveHorizontal } from '@react-icons/all-files/bi/BiMoveHorizontal';
import { BsCollectionPlay } from '@react-icons/all-files/bs/BsCollectionPlay';
import { GiAxeSword } from '@react-icons/all-files/gi/GiAxeSword';
import { GiBackwardTime } from '@react-icons/all-files/gi/GiBackwardTime';
import { GiHealthPotion } from '@react-icons/all-files/gi/GiHealthPotion';
import { GiMove } from '@react-icons/all-files/gi/GiMove';
import { GiSupersonicBullet } from '@react-icons/all-files/gi/GiSupersonicBullet';
import { GiUpgrade } from '@react-icons/all-files/gi/GiUpgrade';
import { useRequest } from '@umijs/max';
import {
  Button,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Switch,
  Tooltip,
  message,
} from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useState } from 'react';
import { BiHash } from '@react-icons/all-files/bi/BiHash';
import { GiEyeTarget } from '@react-icons/all-files/gi/GiEyeTarget';
import styles from './style.less';
// 禁车/允许车辆图标 (内联 SVG 替代 MUI)
const CarCrashIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z" />
    <path d="M1.39 4.22l18.38 18.38 1.41-1.41L2.8 2.81z" fill="#f5222d" />
  </svg>
);
const NoCrashIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z" />
  </svg>
);

type MapSettingProps = {
  // 是否自由视角
  pan?: boolean;
  changePan: (pan: boolean) => void;

  // 是否开启无车模式
  noCar?: boolean;
  changeNoCar: (noCar: boolean) => void;

  //是否开启回放
  record?: boolean;
  changeRecord: (record: boolean) => void;

  // 是否可以移动
  mapsId?: number;
  move?: boolean;
  changeMove: (mapsId: number, move: boolean) => void;
  canMove?: boolean;

  // 生命值设置
  health?: number;
  changeHealth: (health: number) => void;
  changeRoundNumber: (roundNumber: number) => void;

  // 眨眼时间设置
  blinkTime: number | null;
  changeBlinkTime: (blinkTime: number | null) => void;

  // 回合倒计时设置
  countDown?: RoundCountDownType;
  roundTimerPeriod?: number;
  roundTimerGuessPeriod?: number;
  changeCountDown: (
    countDown: RoundCountDownType,
    roundTimerPeriod: number,
    roundTimerGuessPeriod: number,
  ) => void;

  // 是否只读
  readonly?: boolean;
  roundNumber: number;
  gameType?: string;

  // 倍率设置
  open?: boolean;
  startRound?: number | null;
  increment?: number | null;
  changeMultiplier: (
    open: boolean,
    startRound: number | null,
    increment: number | null,
  ) => void;
};

const MapSetting: FC<MapSettingProps> = ({
  pan,
  changePan,
  noCar,
  changeNoCar,
  record,
  changeRecord,
  mapsId,
  move,
  changeMove,
  canMove,
  health,
  changeHealth,
  blinkTime,
  changeBlinkTime,
  countDown,
  roundTimerPeriod,
  roundTimerGuessPeriod,
  changeCountDown,
  readonly,
  roundNumber,
  gameType,
  changeRoundNumber,
  open,
  startRound,
  increment,
  changeMultiplier,
}) => {
  // 弹窗Open状态
  const [mapSettingModal, setMapSettingModal] = useState<boolean>(false);
  const [blink, setBlink] = useState(false);
  const { data: vipExpireDate } = useRequest(checkVipState);

  useEffect(() => {
    setBlink(blinkTime !== null);
  }, [blinkTime]);

  return (
    <div className={styles.mapSettingContainer}>
      <div className={styles.mapSettings}>
        <span>设置</span>
        <p>
          {move ? '可移动' : '不可移动'}/{pan ? '自由视角' : '固定视角'}
        </p>

        <div
          className={styles.mapSettingDescription}
          onClick={() => {
            if (readonly) message.warning('只有房主才能修改');
            else setMapSettingModal(true);
          }}
        >
          <div className={styles.mapSettingBox}>
            <GiMove
              style={move ? { color: '#73d13d' } : { color: '#595959' }}
            />
            <span>{move ? '可移动' : '不可移动'}</span>
          </div>

          <div className={styles.mapSettingBox}>
            <BiMoveHorizontal
              style={pan ? { color: '#73d13d' } : { color: '#595959' }}
            />
            <span>{pan ? '自由视角' : '固定视角'}</span>
          </div>

          <div className={styles.mapSettingBox}>
            {gameType === 'rank' ? (
              <>
                <BiHash />
                <span>{new BigNumber(roundNumber ?? 0).toFormat(0)}轮</span>
              </>
            ) : (
              <>
                <GiHealthPotion />
                <span>{new BigNumber(health ?? 0).toFormat(0)}hp</span>
              </>
            )}
          </div>

          <div className={styles.mapSettingBox}>
            <GiBackwardTime />
            <span>
              {countDown === 'first'
                ? '首选'
                : countDown === 'start'
                  ? '固定'
                  : ''}
              {secondsToMinutesAndSeconds((roundTimerPeriod ?? 0) / 1000)}
              {countDown === 'mixed' &&
                '/' +
                secondsToMinutesAndSeconds(
                  (roundTimerGuessPeriod ?? 0) / 1000,
                )}
            </span>
          </div>

          <div className={styles.mapSettingBox}>
            <GiAxeSword
              style={open ? { color: '#73d13d' } : { color: '#595959' }}
            />
            <span>{open ? '倍率变化' : '恒定倍率'}</span>
          </div>
        </div>
      </div>
      <Modal
        open={mapSettingModal}
        // centered
        maskClosable={true}
        maskStyle={{
          background: 'rgba(9, 7, 35, 0.8)',
          backdropFilter: 'blur(0.5rem)',
        }}
        bodyStyle={
          {
            // background: 'transparent',
          }
        }
        wrapClassName={styles.mapPickerModal}
        title="派对设置"
        // width="100%"
        // footer={false}
        onCancel={() => setMapSettingModal(false)}
        onOk={() => setMapSettingModal(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <div className={styles.mapSettingOptions}>
          {gameType === 'rank' && (
            <div className={styles.mapSettingOption}>
              <div className={styles.mapSettingOptionLabel}>
                <div className={styles.mapSettingOptionLabelIcon}>
                  <GiAxeSword />
                </div>
                <div className={styles.mapSettingOptionLabelDesc}>
                  排位赛轮次数
                </div>
              </div>
              <div className={styles.mapSettingOptionValue}>
                <div className={styles.mapSettingOptionValue}>
                  <InputNumber
                    min={1}
                    max={100}
                    step={5}
                    value={roundNumber}
                    onChange={(value) => value && changeRoundNumber(value)}
                    controls={false}
                    addonBefore={
                      <Button
                        icon={<MinusOutlined />}
                        type="text"
                        disabled={(roundNumber ?? 0) <= 5}
                        onClick={() => changeRoundNumber(roundNumber - 5)} // 保底1000
                      />
                    }
                    addonAfter={
                      <Button
                        icon={<PlusOutlined />}
                        type="text"
                        disabled={(roundNumber ?? 0) >= 100}
                        onClick={() => changeRoundNumber(roundNumber + 5)} // 保底1000
                      />
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <BsCollectionPlay />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>
                是否开启回放 (
                <img
                  src={`${publicPath}/images/user/vip.svg`}
                  width={20}
                />{' '}
                VIP)
              </div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Tooltip title={!vipExpireDate ? '请先开通VIP' : ''}>
                <Switch
                  disabled={!vipExpireDate}
                  checked={record}
                  onChange={(checked) => {
                    changeRecord(checked);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <GiMove />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>
                是否可以移动 (
                <img
                  src={`${publicPath}/images/user/vip.svg`}
                  width={20}
                />{' '}
                VIP)
              </div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Tooltip
                title={
                  !vipExpireDate
                    ? '请先开通VIP'
                    : !canMove
                      ? '所选题库不支持移动'
                      : ''
                }
              >
                <Switch
                  disabled={!canMove || !vipExpireDate}
                  checked={move}
                  onChange={(checked) => {
                    if (mapsId) changeMove(mapsId, checked);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <BiMoveHorizontal />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>
                是否可以移动视角
              </div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Switch checked={pan} onChange={changePan} />
            </div>
          </div>

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                {noCar ? <CarCrashIcon /> : <NoCrashIcon />}
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>
                是否隐藏街景车 (
                <img
                  src={`${publicPath}/images/user/vip.svg`}
                  width={20}
                />{' '}
                VIP)
              </div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Tooltip title={!vipExpireDate ? '请先开通VIP' : ''}>
                <Switch
                  disabled={!vipExpireDate}
                  checked={noCar}
                  onChange={(checked) => {
                    changeNoCar(checked);
                  }}
                />
              </Tooltip>
            </div>
          </div>

          {gameType !== 'rank' && gameType !== 'br' && (
            <div className={styles.mapSettingOption}>
              <div className={styles.mapSettingOptionLabel}>
                <div className={styles.mapSettingOptionLabelIcon}>
                  <GiHealthPotion />
                </div>
                <div className={styles.mapSettingOptionLabelDesc}>生命值</div>
              </div>
              <div className={styles.mapSettingOptionValue}>
                <InputNumber
                  min={1000}
                  max={1000000}
                  step={1000}
                  value={health}
                  onChange={(value) => value && changeHealth(value)}
                  controls={false}
                  addonBefore={
                    <Button
                      icon={<MinusOutlined />}
                      type="text"
                      disabled={(health ?? 0) <= 1000}
                      onClick={() =>
                        changeHealth(
                          (health ?? 0) < 2000 ? 1000 : (health ?? 0) - 1000, // 保底1000
                        )
                      }
                    />
                  }
                  addonAfter={
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      disabled={(health ?? 0) >= 1000000}
                      onClick={() =>
                        changeHealth(
                          (health ?? 0) > 999000
                            ? 1000000
                            : (health ?? 0) + 1000,
                        )
                      }
                    />
                  }
                />
              </div>
            </div>
          )}

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <GiEyeTarget />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>眨眼模式</div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Switch
                checked={blink}
                onChange={() => {
                  if (blink) changeBlinkTime(null);
                  else changeBlinkTime(500);
                  setBlink(!blink);
                }}
              />
            </div>
            {blink && (
              <div className={styles.mapSettingOptionValue}>
                <InputNumber
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={typeof blinkTime === 'number' ? blinkTime / 1000 : 0.5}
                  onChange={(value) => {
                    if (typeof value === 'number')
                      changeBlinkTime(value * 1000);
                  }}
                  controls={false}
                  addonBefore={
                    <Button
                      icon={<MinusOutlined />}
                      type="text"
                      disabled={
                        typeof blinkTime !== 'number' || blinkTime < 200
                      }
                      onClick={() => {
                        if (typeof blinkTime === 'number') {
                          const newValueSec = Math.max(
                            0.1,
                            blinkTime / 1000 - 0.1,
                          );
                          changeBlinkTime(Math.round(newValueSec * 1000));
                        }
                      }}
                    />
                  }
                  addonAfter={
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      disabled={
                        typeof blinkTime !== 'number' || blinkTime > 2900
                      }
                      onClick={() => {
                        if (typeof blinkTime === 'number') {
                          const newValueSec = Math.min(
                            3.0,
                            blinkTime / 1000 + 0.1,
                          );
                          changeBlinkTime(Math.round(newValueSec * 1000));
                        }
                      }}
                    />
                  }
                />
              </div>
            )}
          </div>

          <div
            className={`${styles.mapSettingOption} ${styles.mapSettingRoundTime}`}
          >
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <GiBackwardTime />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>回合时间</div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <div className={styles.mapSettingOptionTimer}>
                {countDown === 'mixed' && '固定'}
                <InputNumber
                  min={5}
                  max={600}
                  step={5}
                  value={
                    (roundTimerPeriod ??
                      (countDown === 'mixed' ? 60000 : 15000)) / 1000
                  }
                  onChange={(value) =>
                    value &&
                    changeCountDown(
                      countDown as RoundCountDownType,
                      value * 1000,
                      roundTimerGuessPeriod ?? 15000,
                    )
                  }
                  onBlur={() => { }}
                  controls={false}
                  addonBefore={
                    <Button
                      icon={<MinusOutlined />}
                      type="text"
                      disabled={
                        (roundTimerPeriod ?? 0) <= 5000 ||
                        (roundTimerPeriod ?? 10) - 5 <
                        (roundTimerGuessPeriod ?? 0)
                      }
                      onClick={() =>
                        changeCountDown(
                          countDown as RoundCountDownType,
                          (roundTimerPeriod ?? 0) - 5000,
                          roundTimerGuessPeriod ?? 15000,
                        )
                      }
                    />
                  }
                  addonAfter={
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      disabled={(roundTimerPeriod ?? 0) >= 600000}
                      onClick={() =>
                        changeCountDown(
                          countDown as RoundCountDownType,
                          (roundTimerPeriod ?? 0) + 5000,
                          roundTimerGuessPeriod ?? 15000,
                        )
                      }
                    />
                  }
                />
                秒
              </div>
              {countDown === 'mixed' && (
                <div className={styles.mapSettingOptionTimer}>
                  {countDown === 'mixed' && '选后'}
                  <InputNumber
                    min={5}
                    max={600}
                    step={5}
                    value={(roundTimerGuessPeriod ?? 15000) / 1000}
                    onChange={(value) =>
                      value &&
                      changeCountDown(
                        countDown as RoundCountDownType,
                        roundTimerPeriod ?? 0,
                        value * 1000,
                      )
                    }
                    onBlur={() => { }}
                    controls={false}
                    addonBefore={
                      <Button
                        icon={<MinusOutlined />}
                        type="text"
                        disabled={(roundTimerGuessPeriod ?? 0) <= 5000}
                        onClick={() =>
                          changeCountDown(
                            countDown as RoundCountDownType,
                            roundTimerPeriod ?? 0,
                            (roundTimerGuessPeriod ?? 0) - 5000,
                          )
                        }
                      />
                    }
                    addonAfter={
                      <Button
                        icon={<PlusOutlined />}
                        type="text"
                        disabled={
                          (roundTimerGuessPeriod ?? 0) >= 600000 ||
                          (roundTimerGuessPeriod ?? 0) + 5 >
                          (roundTimerPeriod ?? 10)
                        }
                        onClick={() =>
                          changeCountDown(
                            countDown as RoundCountDownType,
                            roundTimerPeriod ?? 0,
                            (roundTimerGuessPeriod ?? 0) + 5000,
                          )
                        }
                      />
                    }
                  />
                  秒
                </div>
              )}
              <Segmented
                options={[
                  { label: '首次确认后', value: 'first' },
                  { label: '每轮固定', value: 'start' },
                  {
                    label: '混合',
                    value: 'mixed',
                  },
                ]}
                value={countDown}
                onChange={(value) => {
                  if (value) {
                    if (value === 'mixed') {
                      changeCountDown(
                        value as RoundCountDownType,
                        60000,
                        15000,
                      );
                    } else {
                      changeCountDown(
                        value as RoundCountDownType,
                        15000,
                        15000,
                      );
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className={styles.mapSettingOption}>
            <div className={styles.mapSettingOptionLabel}>
              <div className={styles.mapSettingOptionLabelIcon}>
                <GiAxeSword />
              </div>
              <div className={styles.mapSettingOptionLabelDesc}>是否加倍</div>
            </div>
            <div className={styles.mapSettingOptionValue}>
              <Switch
                checked={open}
                onChange={(checked) =>
                  changeMultiplier(checked, startRound ?? 6, increment ?? 0.5)
                }
              />
            </div>
          </div>

          {open ? (
            <>
              <div className={styles.mapSettingOption}>
                <div className={styles.mapSettingOptionLabel}>
                  <div className={styles.mapSettingOptionLabelIcon}>
                    <GiSupersonicBullet />
                  </div>
                  <div className={styles.mapSettingOptionLabelDesc}>
                    何时开始加倍
                  </div>
                </div>
                <div className={styles.mapSettingOptionValue}>
                  第
                  <Select
                    value={startRound ?? 6}
                    style={{ width: 75, margin: '0 4px' }}
                    onChange={(value) =>
                      changeMultiplier(open, value, increment ?? 0.5)
                    }
                  >
                    <Select.Option value={2}>2轮</Select.Option>
                    <Select.Option value={4}>4轮</Select.Option>
                    <Select.Option value={6}>6轮</Select.Option>
                    <Select.Option value={8}>8轮</Select.Option>
                    <Select.Option value={11}>11轮</Select.Option>
                  </Select>
                  起
                </div>
              </div>

              <div className={styles.mapSettingOption}>
                <div className={styles.mapSettingOptionLabel}>
                  <div className={styles.mapSettingOptionLabelIcon}>
                    <GiUpgrade />
                  </div>
                  <div className={styles.mapSettingOptionLabelDesc}>
                    倍率递增速率
                  </div>
                </div>
                <div className={styles.mapSettingOptionValue}>
                  每轮递增
                  <Select
                    value={increment ?? 0.5}
                    style={{ width: 100, margin: '0 0 0 4px' }}
                    onChange={(value) =>
                      changeMultiplier(open, startRound ?? 6, value)
                    }
                  >
                    <Select.Option value={0.2}>0.2倍</Select.Option>
                    <Select.Option value={0.5}>0.5倍</Select.Option>
                    <Select.Option value={1.0}>1.0倍</Select.Option>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {/* open ? (
            <>
              <div className={styles.mapSettingOption}>
                <div className={styles.mapSettingOptionLabel}>
                  <div className={styles.mapSettingOptionLabelIcon}>
                    <GiSupersonicBullet />
                  </div>
                  <div className={styles.mapSettingOptionLabelDesc}>
                    何时开始加倍
                  </div>
                </div>
                <div className={styles.mapSettingOptionValue}>
                  <div className={styles.mapSettingOptionValue}>
                    第
                    <InputNumber
                      min={2}
                      max={10}
                      step={1}
                      value={startRound ?? 6}
                      onChange={(value) =>
                        value && changeMultiplier(open, value, increment ?? 0.5)
                      }
                      controls={false}
                      addonBefore={
                        <Button
                          icon={<MinusOutlined />}
                          type="text"
                          disabled={(startRound ?? 0) <= 1}
                          onClick={() =>
                            changeMultiplier(
                              open,
                              (startRound ?? 0) - 1,
                              increment ?? 0.5,
                            )
                          }
                        />
                      }
                      addonAfter={
                        <Button
                          icon={<PlusOutlined />}
                          type="text"
                          disabled={(startRound ?? 0) >= 100}
                          onClick={() =>
                            changeMultiplier(
                              open,
                              (startRound ?? 0) + 1,
                              increment ?? 0.5,
                            )
                          }
                        />
                      }
                    />
                    轮
                  </div>
                </div>
              </div>

              <div className={styles.mapSettingOption}>
                <div className={styles.mapSettingOptionLabel}>
                  <div className={styles.mapSettingOptionLabelIcon}>
                    <GiUpgrade />
                  </div>
                  <div className={styles.mapSettingOptionLabelDesc}>
                    倍率递增速率
                  </div>
                </div>

                <div className={styles.mapSettingOptionValue}>
                  <div className={styles.mapSettingOptionValue}>
                    每轮加
                    <InputNumber
                      min={0}
                      max={2}
                      step={0.1}
                      precision={1}
                      value={increment ?? 0.5}
                      onChange={(value) =>
                        value && changeMultiplier(open, startRound ?? 6, value)
                      }
                      controls={false}
                      addonBefore={
                        <Button
                          icon={<MinusOutlined />}
                          type="text"
                          disabled={(increment ?? 0) <= 0}
                          onClick={() =>
                            changeMultiplier(
                              open,
                              startRound ?? 6,
                              (increment ?? 0) - 0.1,
                            )
                          }
                        />
                      }
                      addonAfter={
                        <Button
                          icon={<PlusOutlined />}
                          type="text"
                          disabled={(increment ?? 0) >= 2}
                          onClick={() =>
                            changeMultiplier(
                              open,
                              startRound ?? 6,
                              (increment ?? 0) + 0.1,
                            )
                          }
                        />
                      }
                    />
                    倍
                  </div>
                </div>
              </div>
            </>
          ) : null */}
        </div>
      </Modal>
    </div>
  );
};

export default MapSetting;
