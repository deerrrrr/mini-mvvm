import { isObject } from "@vue/shared"
import {
  reactiveHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from "./baseHandlers"
export function reactive(target) {
  return createReactObj(target, false, reactiveHandlers)
}

export function shallowReactive(target) {
  return createReactObj(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
  return createReactObj(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactObj(target, true, shallowReadonlyHandlers)
}

// 实现代理的核心
// ！！优化 防止重复代理
const reactiveMap = new WeakMap() // key必须是对象，自动的垃圾回收
const readonlyMap = new WeakMap()
// 柯里化：根据不同的参数
function createReactObj(target, isReadonly, baseHandlers) {
  // 如果不是对象
  if (!isObject(target)) {
    return target
  }
  // 优化
  const proxymap = isReadonly ? readonlyMap : reactiveMap
  const proxyEs = proxymap.get(target) // 有
  if (proxyEs) {
    return proxyEs
  }
  const proxy = new Proxy(target, baseHandlers)
  proxymap.set(target, proxy) // 存入
  return proxy
}