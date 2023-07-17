import { isArray, isIntegerKey } from "@vue/shared"
import { TriggerOpTypes } from "./operations"

export function effect(fn, options: any = {}) {
  const effect = createReactEffect(fn, options)
  // 判断
  if (!options.lazy) {
    effect()  // 默认执行
  }
  return effect
}

let uid = 0 // 用于区分不同的effect
let activeEffect //保存当前的effect 给Track可以用
const effectStack = [] //解决嵌套问题，栈结构

function createReactEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {  // 不重复
      // 为解决嵌套问题
      try {
        effectStack.push(effect)
        activeEffect = effect
        return fn() // 执行用户的方法
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = uid++ // 区别effect
  effect._isEffect = true // 是不是响应式的effect
  effect.raw = fn // 保存用户的方法
  effect.options = options // 保存用户的属性
  return effect
}

// 收集effect
let targetMap = new WeakMap()
export function Track(target, type, key) {
  if (activeEffect === undefined) { // 没有在effect中使用
    return
  }
  let depMap = targetMap.get(target)
  if (!depMap) { // 没有这个对象
    targetMap.set(target, (depMap = new Map)) // 添加值
  }
  let dep = depMap.get(key)
  if (!dep) { // 没有属性
    depMap.set(key, (dep = new Set))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect) //收集effect
  }

}


// 触发更新
export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  let effectSet = new Set() // Set结构可以避免重复
  const add = (effectAdd) => {
    if (effectAdd) {
      effectAdd.forEach(effect => effectSet.add(effect))
    }
  }

  if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= newValue) {
        add(dep)
      }
    })
  } else {
    // 对象
    if (key !== undefined) {
      add(depsMap.get(key))
    }
    // 数组
    switch (type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'))
        }
    }

  }
  // 执行 触发effect
  effectSet.forEach((effect: any) => {
    if (effect.options.changeDirty) {// 不再次get不会执行effect
      effect.options.changeDirty()
    } else {
      effect()
    }
  })
}