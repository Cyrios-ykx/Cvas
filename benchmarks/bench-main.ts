/**
 * Vuvas 性能基准测试 - 主入口
 *
 * 负责：
 * - 运行测试套件
 * - 渲染结果 UI
 * - 导出报告
 */

import {
  allBenchmarks,
  type BenchmarkResult,
  type FrameRateResult,
  type MemoryResult,
  type AnyBenchmarkResult
} from './bench-suite'

// ============================================================
// UI 渲染
// ============================================================

const resultsContainer = document.getElementById('results')!
const statusEl = document.getElementById('status')!
const btnRunAll = document.getElementById('btn-run-all') as HTMLButtonElement
const btnExport = document.getElementById('btn-export') as HTMLButtonElement

let allResults: AnyBenchmarkResult[] = []

/**
 * 渲染单个基准测试结果卡片
 */
function renderBenchmarkCard(result: BenchmarkResult): string {
  const maxTime = Math.max(result.vuvasTime, result.domTime)
  const vuvasPercent = (result.vuvasTime / maxTime) * 100
  const domPercent = (result.domTime / maxTime) * 100
  const vuvasWins = result.vuvasTime < result.domTime

  return `
    <div class="benchmark-card">
      <h3>${result.name}</h3>
      <p class="description">${result.description}</p>
      <div class="bar-chart">
        <div class="bar-row">
          <span class="bar-label">Vuvas (Canvas)</span>
          <div class="bar-track">
            <div class="bar-fill vuvas" style="width: ${vuvasPercent}%"></div>
          </div>
          <span class="bar-value ${vuvasWins ? 'winner' : 'loser'}">${result.vuvasTime} ${result.unit}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Vue-like DOM</span>
          <div class="bar-track">
            <div class="bar-fill vue-dom" style="width: ${domPercent}%"></div>
          </div>
          <span class="bar-value ${!vuvasWins ? 'winner' : 'loser'}">${result.domTime} ${result.unit}</span>
        </div>
      </div>
      <p class="description" style="margin-top: 12px; margin-bottom: 0;">
        ${vuvasWins
          ? `🚀 Vuvas 快 <strong style="color:#42b883">${result.ratio}x</strong>`
          : `⚠️ DOM 快 <strong style="color:#f56c6c">${(1 / result.ratio).toFixed(2)}x</strong>`
        }
      </p>
    </div>
  `
}

/**
 * 渲染帧率测试结果卡片
 */
function renderFrameRateCard(result: FrameRateResult): string {
  const maxFps = Math.max(result.vuvasFps, result.domFps)
  const vuvasPercent = (result.vuvasFps / maxFps) * 100
  const domPercent = (result.domFps / maxFps) * 100
  const vuvasWins = result.vuvasFps > result.domFps

  return `
    <div class="benchmark-card">
      <h3>${result.name}</h3>
      <p class="description">${result.description}</p>
      <div class="bar-chart">
        <div class="bar-row">
          <span class="bar-label">Vuvas (Canvas)</span>
          <div class="bar-track">
            <div class="bar-fill vuvas" style="width: ${vuvasPercent}%"></div>
          </div>
          <span class="bar-value ${vuvasWins ? 'winner' : 'loser'}">${result.vuvasFps} fps</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Vue-like DOM</span>
          <div class="bar-track">
            <div class="bar-fill vue-dom" style="width: ${domPercent}%"></div>
          </div>
          <span class="bar-value ${!vuvasWins ? 'winner' : 'loser'}">${result.domFps} fps</span>
        </div>
      </div>
      <p class="description" style="margin-top: 12px; margin-bottom: 0;">
        掉帧：Vuvas ${result.vuvasDropped} 次 / DOM ${result.domDropped} 次
        ${vuvasWins
          ? ` | 🚀 Vuvas 帧率高 <strong style="color:#42b883">${result.ratio}x</strong>`
          : ` | ⚠️ DOM 帧率高 <strong style="color:#f56c6c">${(1 / result.ratio).toFixed(2)}x</strong>`
        }
      </p>
    </div>
  `
}

/**
 * 渲染内存测试结果卡片
 */
function renderMemoryCard(result: MemoryResult): string {
  const hasData = result.points.some(p => p.vuvasMemory > 0 || p.domMemory > 0)

  if (!hasData) {
    return `
      <div class="benchmark-card">
        <h3>${result.name}</h3>
        <p class="description">${result.description}</p>
        <p class="description" style="color: #f0ad4e;">
          ⚠️ 内存数据不可用。请使用 Chrome 并添加启动参数 <code>--enable-precise-memory-info</code> 以获取内存数据。
        </p>
      </div>
    `
  }

  const rows = result.points.map(p => `
    <tr>
      <td>${p.nodeCount}</td>
      <td style="color: #42b883;">${p.vuvasMemory} KB</td>
      <td style="color: #f56c6c;">${p.domMemory} KB</td>
      <td>${p.domMemory > 0 ? ((p.domMemory / p.vuvasMemory) || 0).toFixed(2) + 'x' : '-'}</td>
    </tr>
  `).join('')

  return `
    <div class="benchmark-card">
      <h3>${result.name}</h3>
      <p class="description">${result.description}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
        <thead>
          <tr style="border-bottom:1px solid #38444d;">
            <th style="text-align:left;padding:8px;">节点数</th>
            <th style="text-align:left;padding:8px;color:#42b883;">Vuvas</th>
            <th style="text-align:left;padding:8px;color:#f56c6c;">DOM</th>
            <th style="text-align:left;padding:8px;">DOM/Vuvas</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

/**
 * 渲染总结卡片
 */
function renderSummary(results: AnyBenchmarkResult[]): string {
  // 计算 Vuvas 赢了几项
  let vuvasWins = 0
  let totalTests = 0

  for (const r of results) {
    if ('vuvasTime' in r) {
      totalTests++
      if (r.vuvasTime < r.domTime) vuvasWins++
    } else if ('vuvasFps' in r) {
      totalTests++
      if (r.vuvasFps > r.domFps) vuvasWins++
    }
  }

  // 计算平均性能倍率
  const ratios = results
    .filter((r): r is BenchmarkResult | FrameRateResult => 'ratio' in r)
    .map(r => r.ratio)
  const avgRatio = ratios.length > 0
    ? (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2)
    : '1.00'

  return `
    <div class="summary">
      <h2>📊 测试总结</h2>
      <div class="score">${avgRatio}x</div>
      <p class="detail">
        Vuvas 平均性能倍率 | 赢得 ${vuvasWins}/${totalTests} 项测试
      </p>
      <p class="detail" style="margin-top: 4px; font-size: 12px; color: #536471;">
        测试环境：${navigator.userAgent.split(' ').slice(-2).join(' ')} | ${new Date().toLocaleString('zh-CN')}
      </p>
    </div>
  `
}

// ============================================================
// 运行测试
// ============================================================

async function runAllBenchmarks() {
  btnRunAll.disabled = true
  allResults = []
  resultsContainer.innerHTML = `
    <div class="status">
      <span class="spinner"></span>
      正在运行基准测试，请稍候...
    </div>
  `

  for (let i = 0; i < allBenchmarks.length; i++) {
    // 更新进度
    resultsContainer.innerHTML = `
      <div class="status">
        <span class="spinner"></span>
        正在运行测试 ${i + 1}/${allBenchmarks.length}...
      </div>
    `

    // 等待一帧让 UI 更新
    await new Promise(resolve => requestAnimationFrame(resolve))
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const result = await allBenchmarks[i]()
      allResults.push(result)
    } catch (err) {
      console.error(`测试 ${i + 1} 失败:`, err)
    }
  }

  // 渲染所有结果
  let html = ''
  for (const result of allResults) {
    if ('vuvasTime' in result) {
      html += renderBenchmarkCard(result as BenchmarkResult)
    } else if ('vuvasFps' in result) {
      html += renderFrameRateCard(result as FrameRateResult)
    } else if ('points' in result) {
      html += renderMemoryCard(result as MemoryResult)
    }
  }

  html += renderSummary(allResults)
  resultsContainer.innerHTML = html

  btnRunAll.disabled = false
}

// ============================================================
// 导出报告
// ============================================================

function exportReport() {
  if (allResults.length === 0) {
    alert('请先运行测试！')
    return
  }

  const report = {
    title: 'Vuvas 性能基准测试报告',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    results: allResults
  }

  // 生成 JSON 报告
  const json = JSON.stringify(report, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `vuvas-benchmark-${Date.now()}.json`
  a.click()

  URL.revokeObjectURL(url)
}

// ============================================================
// 事件绑定
// ============================================================

btnRunAll.addEventListener('click', runAllBenchmarks)
btnExport.addEventListener('click', exportReport)
