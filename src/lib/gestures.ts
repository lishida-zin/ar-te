/**
 * タッチジェスチャーユーティリティ
 * ピンチ（スケール）と二本指回転の検出
 */

interface TouchPoint {
  clientX: number;
  clientY: number;
}

/** 2点間の距離を計算 */
function getDistance(t1: TouchPoint, t2: TouchPoint): number {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 2点間の角度（ラジアン）を計算 */
function getAngle(t1: TouchPoint, t2: TouchPoint): number {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
}

/**
 * ピンチスケール比を計算
 * @returns スケール比 (1.0 = 変化なし, >1 = 拡大, <1 = 縮小)
 */
export function computePinchScale(
  prevTouches: [TouchPoint, TouchPoint],
  currTouches: [TouchPoint, TouchPoint],
): number {
  const prevDist = getDistance(prevTouches[0], prevTouches[1]);
  const currDist = getDistance(currTouches[0], currTouches[1]);
  if (prevDist === 0) return 1;
  return currDist / prevDist;
}

/**
 * 二本指回転の角度差（ラジアン）を計算
 * @returns Y軸回転に適用する角度差（ラジアン）
 */
export function computeRotationDelta(
  prevTouches: [TouchPoint, TouchPoint],
  currTouches: [TouchPoint, TouchPoint],
): number {
  const prevAngle = getAngle(prevTouches[0], prevTouches[1]);
  const currAngle = getAngle(currTouches[0], currTouches[1]);
  return currAngle - prevAngle;
}
