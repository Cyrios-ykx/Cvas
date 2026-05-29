/**
 * Vuvas 调度器
 * 负责批量更新和异步调度，避免频繁重渲染
 *
 * 核心机制：
 * - 将多次状态变更合并为一次渲染（类似 Vue 的 nextTick）
 * - 使用微任务（Promise.then）实现异步批量更新
 * - 支持优先级调度：高优先级任务优先执行
 */

/** 任务优先级 */
export enum JobPriority {
  /** 同步立即执行（用户输入响应） */
  SYNC = 0,
  /** 高优先级（动画帧） */
  HIGH = 1,
  /** 普通优先级（状态更新、重渲染） */
  NORMAL = 2,
  /** 低优先级（预加载、后台计算） */
  LOW = 3,
  /** 空闲时执行（非关键任务） */
  IDLE = 4
}

/** 带优先级的任务 */
interface SchedulerJob {
  fn: () => void
  priority: JobPriority
  id: number
}

/** 待执行的任务队列 */
const queue: SchedulerJob[] = []
/** 是否正在刷新队列 */
let isFlushing = false
/** 是否已经安排了刷新 */
let isFlushPending = false
/** 任务 ID 计数器 */
let jobId = 0

/** flush 完成后的回调列表（用于通知 Canvas 重渲染） */
const postFlushCallbacks: (() => void)[] = []

/** 用于创建微任务的 Promise */
const resolvedPromise = Promise.resolve()

/**
 * nextTick - 在下一个微任务中执行回调
 * 类似 Vue3 的 nextTick，确保在 DOM（Canvas）更新后执行
 */
export function nextTick(fn?: () => void): Promise<void> {
  const p = resolvedPromise
  return fn ? p.then(fn) : p
}

/**
 * 将任务加入调度队列（默认普通优先级）
 * 同一个 tick 内的多次调用会被合并
 */
export function queueJob(job: () => void, priority: JobPriority = JobPriority.NORMAL): void {
  // 去重：避免同一个 job 被多次加入队列
  if (!queue.some(j => j.fn === job)) {
    queue.push({ fn: job, priority, id: jobId++ })
    // 按优先级排序（数值越小优先级越高）
    queue.sort((a, b) => a.priority - b.priority || a.id - b.id)
  }
  queueFlush()
}

/**
 * 加入高优先级任务（动画帧级别）
 */
export function queueHighPriorityJob(job: () => void): void {
  queueJob(job, JobPriority.HIGH)
}

/**
 * 加入低优先级任务（后台执行）
 */
export function queueLowPriorityJob(job: () => void): void {
  queueJob(job, JobPriority.LOW)
}

/**
 * 加入空闲任务（使用 requestIdleCallback）
 */
export function queueIdleJob(job: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => job())
  } else {
    // 降级为 setTimeout
    setTimeout(job, 0)
  }
}

/**
 * 安排队列刷新（微任务）
 */
function queueFlush(): void {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    resolvedPromise.then(flushJobs)
  }
}

/**
 * 注册 flush 完成后的回调
 * 用于在所有组件更新完成后触发 Canvas 重渲染
 */
export function onSchedulerFlushed(cb: () => void): void {
  if (!postFlushCallbacks.includes(cb)) {
    postFlushCallbacks.push(cb)
  }
}

/**
 * 移除 flush 完成后的回调
 */
export function offSchedulerFlushed(cb: () => void): void {
  const idx = postFlushCallbacks.indexOf(cb)
  if (idx > -1) {
    postFlushCallbacks.splice(idx, 1)
  }
}

/**
 * 刷新队列，按优先级执行所有待处理的任务
 */
function flushJobs(): void {
  isFlushPending = false
  isFlushing = true

  try {
    // 按优先级顺序执行所有任务（已排序）
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i]
      job.fn()
    }
  } finally {
    // 清空队列
    queue.length = 0
    isFlushing = false

    // 通知所有 flush 完成回调（触发 Canvas 重渲染）
    for (const cb of postFlushCallbacks) {
      cb()
    }
  }
}
