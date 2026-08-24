// 对齐度的呈现强度由置信度决定。零依赖，可单测。
//
// **这是 PRD 5.2 的要求，不是配色偏好。**
// 低置信度时仍打出红色「差距较大」和 28 号大字，视觉上传达的是判决而非校准，
// 正是原则四禁止的「证据不足时强行下结论」。

export type Confidence = 'low' | 'medium' | 'high';

export interface GapPresentation {
  /** 钳制到 0-100 后的分数 */
  score: number;
  /** true 表示要降级呈现：不上红色、分数缩小转灰、结论标签换成「还不能下结论」 */
  tentative: boolean;
  /** 'neutral' 时不使用红/黄/绿的判决色 */
  tone: 'neutral' | 'good' | 'warn' | 'bad';
  /** 是否在说明里补上「N 天里只有 M 天有记录」 */
  sparse: boolean;
}

/** 记录天数低于窗口的这个比例时，才算稀疏到值得点名 */
const SPARSE_RATIO = 0.5;

export function gapPresentation(
  alignmentScore: number,
  confidence: Confidence,
  recordedDays?: number,
  windowDays?: number
): GapPresentation {
  const score = Math.min(100, Math.max(0, Math.round(alignmentScore || 0)));
  const tentative = confidence === 'low';

  const tone: GapPresentation['tone'] = tentative
    ? 'neutral'
    : score >= 80
      ? 'good'
      : score >= 50
        ? 'warn'
        : 'bad';

  // 低置信度不一定是天数少（也可能是主题分布极不均衡），
  // 只有记录确实稀疏时才提天数，否则「30 天里只有 30 天有记录」读起来很荒谬。
  const sparse =
    tentative &&
    recordedDays !== undefined &&
    windowDays !== undefined &&
    windowDays > 0 &&
    recordedDays < windowDays * SPARSE_RATIO;

  return { score, tentative, tone, sparse };
}
