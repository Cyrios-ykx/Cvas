/**
 * Vuvas 路由系统（canvas-router）
 *
 * 类似 Vue Router 的 Canvas 路由方案：
 * - 基于 hash 或 history 模式
 * - 路由匹配 + 参数提取
 * - 导航守卫
 * - 响应式当前路由
 *
 * 使用方式：
 * ```ts
 * import { createRouter } from 'vuvas'
 *
 * const router = createRouter({
 *   routes: [
 *     { path: '/', component: Home },
 *     { path: '/about', component: About },
 *     { path: '/user/:id', component: UserDetail }
 *   ]
 * })
 * ```
 */

import { ref, computed, type Ref } from '../reactivity'

// ============================================================
// 路由类型定义
// ============================================================

/** 路由记录 */
export interface RouteRecord {
  /** 路径模式（支持 :param 动态参数） */
  path: string
  /** 路由名称 */
  name?: string
  /** 对应的组件定义 */
  component: any
  /** 路由元信息 */
  meta?: Record<string, any>
  /** 子路由 */
  children?: RouteRecord[]
  /** 重定向 */
  redirect?: string
}

/** 当前路由位置 */
export interface RouteLocation {
  /** 完整路径 */
  path: string
  /** 路由名称 */
  name?: string
  /** 路径参数 */
  params: Record<string, string>
  /** 查询参数 */
  query: Record<string, string>
  /** hash */
  hash: string
  /** 匹配的路由记录 */
  matched: RouteRecord | null
  /** 路由元信息 */
  meta: Record<string, any>
}

/** 导航守卫 */
export type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation
) => boolean | string | void | Promise<boolean | string | void>

/** 路由器选项 */
export interface RouterOptions {
  /** 路由记录列表 */
  routes: RouteRecord[]
  /** 路由模式 */
  mode?: 'hash' | 'history'
}

// ============================================================
// 路由器实现
// ============================================================

/** 路由器实例 */
export class Router {
  /** 路由记录 */
  private routes: RouteRecord[]
  /** 路由模式 */
  private mode: 'hash' | 'history'
  /** 当前路由（响应式） */
  private _currentRoute: Ref<RouteLocation>
  /** 前置守卫列表 */
  private beforeGuards: NavigationGuard[] = []
  /** 后置钩子列表 */
  private afterHooks: ((to: RouteLocation, from: RouteLocation) => void)[] = []

  constructor(options: RouterOptions) {
    this.routes = options.routes
    this.mode = options.mode || 'hash'

    // 初始化当前路由
    this._currentRoute = ref(this.resolve(this.getCurrentPath())) as Ref<RouteLocation>

    // 监听路由变化
    this.setupListeners()
  }

  /** 当前路由（响应式） */
  get currentRoute(): Ref<RouteLocation> {
    return this._currentRoute
  }

  /** 当前路由的计算属性快捷方式 */
  get route(): RouteLocation {
    return this._currentRoute.value
  }

  /**
   * 导航到指定路径
   */
  async push(to: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }): Promise<void> {
    let targetPath: string

    if (typeof to === 'string') {
      targetPath = to
    } else if (to.name) {
      // 按名称查找路由
      const record = this.findByName(to.name)
      if (!record) {
        console.warn(`[Vuvas Router] 未找到路由: ${to.name}`)
        return
      }
      targetPath = this.buildPath(record.path, to.params || {})
    } else {
      targetPath = to.path || '/'
    }

    // 添加查询参数
    if (typeof to !== 'string' && to.query) {
      const queryStr = Object.entries(to.query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      if (queryStr) targetPath += '?' + queryStr
    }

    const toLocation = this.resolve(targetPath)
    const fromLocation = this._currentRoute.value

    // 执行前置守卫
    for (const guard of this.beforeGuards) {
      const result = await guard(toLocation, fromLocation)
      if (result === false) return // 取消导航
      if (typeof result === 'string') {
        // 重定向
        await this.push(result)
        return
      }
    }

    // 处理重定向
    if (toLocation.matched?.redirect) {
      await this.push(toLocation.matched.redirect)
      return
    }

    // 更新 URL
    this.updateURL(targetPath)

    // 更新当前路由
    this._currentRoute.value = toLocation

    // 执行后置钩子
    for (const hook of this.afterHooks) {
      hook(toLocation, fromLocation)
    }
  }

  /**
   * 替换当前路由（不产生历史记录）
   */
  async replace(to: string): Promise<void> {
    const toLocation = this.resolve(to)
    const fromLocation = this._currentRoute.value

    // 执行前置守卫
    for (const guard of this.beforeGuards) {
      const result = await guard(toLocation, fromLocation)
      if (result === false) return
      if (typeof result === 'string') {
        await this.replace(result)
        return
      }
    }

    // 更新 URL（替换模式）
    if (this.mode === 'hash') {
      window.location.replace(`#${to}`)
    } else {
      window.history.replaceState(null, '', to)
    }

    this._currentRoute.value = toLocation

    for (const hook of this.afterHooks) {
      hook(toLocation, fromLocation)
    }
  }

  /**
   * 后退
   */
  back(): void {
    window.history.back()
  }

  /**
   * 前进
   */
  forward(): void {
    window.history.forward()
  }

  /**
   * 注册全局前置守卫
   */
  beforeEach(guard: NavigationGuard): () => void {
    this.beforeGuards.push(guard)
    return () => {
      const idx = this.beforeGuards.indexOf(guard)
      if (idx !== -1) this.beforeGuards.splice(idx, 1)
    }
  }

  /**
   * 注册全局后置钩子
   */
  afterEach(hook: (to: RouteLocation, from: RouteLocation) => void): () => void {
    this.afterHooks.push(hook)
    return () => {
      const idx = this.afterHooks.indexOf(hook)
      if (idx !== -1) this.afterHooks.splice(idx, 1)
    }
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /** 解析路径为 RouteLocation */
  private resolve(fullPath: string): RouteLocation {
    // 分离 path、query、hash
    let path = fullPath
    let queryStr = ''
    let hash = ''

    const hashIdx = path.indexOf('#')
    if (hashIdx !== -1) {
      hash = path.slice(hashIdx)
      path = path.slice(0, hashIdx)
    }

    const queryIdx = path.indexOf('?')
    if (queryIdx !== -1) {
      queryStr = path.slice(queryIdx + 1)
      path = path.slice(0, queryIdx)
    }

    // 解析查询参数
    const query: Record<string, string> = {}
    if (queryStr) {
      for (const pair of queryStr.split('&')) {
        const [key, value] = pair.split('=')
        query[decodeURIComponent(key)] = decodeURIComponent(value || '')
      }
    }

    // 匹配路由
    const { record, params } = this.matchRoute(path)

    return {
      path,
      name: record?.name,
      params,
      query,
      hash,
      matched: record,
      meta: record?.meta || {}
    }
  }

  /** 匹配路由记录 */
  private matchRoute(path: string): { record: RouteRecord | null; params: Record<string, string> } {
    for (const route of this.routes) {
      const params = this.matchPath(route.path, path)
      if (params !== null) {
        return { record: route, params }
      }
      // 检查子路由
      if (route.children) {
        for (const child of route.children) {
          const childPath = route.path + '/' + child.path
          const childParams = this.matchPath(childPath, path)
          if (childParams !== null) {
            return { record: child, params: childParams }
          }
        }
      }
    }
    return { record: null, params: {} }
  }

  /** 路径模式匹配（支持 :param） */
  private matchPath(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)

    if (patternParts.length !== pathParts.length) return null

    const params: Record<string, string> = {}
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // 动态参数
        params[patternParts[i].slice(1)] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        return null
      }
    }
    return params
  }

  /** 按名称查找路由 */
  private findByName(name: string): RouteRecord | undefined {
    for (const route of this.routes) {
      if (route.name === name) return route
      if (route.children) {
        const child = route.children.find(c => c.name === name)
        if (child) return child
      }
    }
    return undefined
  }

  /** 构建路径（替换动态参数） */
  private buildPath(pattern: string, params: Record<string, string>): string {
    return pattern.replace(/:(\w+)/g, (_, key) => params[key] || '')
  }

  /** 获取当前路径 */
  private getCurrentPath(): string {
    if (this.mode === 'hash') {
      return window.location.hash.slice(1) || '/'
    }
    return window.location.pathname
  }

  /** 更新 URL */
  private updateURL(path: string): void {
    if (this.mode === 'hash') {
      window.location.hash = path
    } else {
      window.history.pushState(null, '', path)
    }
  }

  /** 监听浏览器路由变化 */
  private setupListeners(): void {
    if (this.mode === 'hash') {
      window.addEventListener('hashchange', () => {
        this._currentRoute.value = this.resolve(this.getCurrentPath())
      })
    } else {
      window.addEventListener('popstate', () => {
        this._currentRoute.value = this.resolve(this.getCurrentPath())
      })
    }
  }
}

// ============================================================
// 公共 API
// ============================================================

/**
 * 创建路由器实例
 */
export function createRouter(options: RouterOptions): Router {
  return new Router(options)
}

/**
 * 在组件 setup 中获取当前路由（响应式）
 */
export function useRoute(): Ref<RouteLocation> {
  // 需要通过 inject 获取路由实例
  // 简化实现：返回全局路由实例的 currentRoute
  return _globalRouter?.currentRoute || ref({
    path: '/',
    params: {},
    query: {},
    hash: '',
    matched: null,
    meta: {}
  }) as Ref<RouteLocation>
}

/**
 * 在组件 setup 中获取路由器实例
 */
export function useRouter(): Router {
  if (!_globalRouter) {
    throw new Error('[Vuvas Router] 未安装路由器，请先调用 createRouter()')
  }
  return _globalRouter
}

/** 全局路由器实例（简化实现） */
let _globalRouter: Router | null = null

/**
 * 安装路由器到应用
 */
export function installRouter(router: Router): void {
  _globalRouter = router
}
