import { extend, hasChange, hasOwn, isArray, isIntegerKey, isObject } from "@vue/shared"
import { Track, trigger } from "./effect"
import { TrackOpType, TriggerOpTypes } from "./operations"
import { reactive, readonly } from "./reactiveApi"

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    if (!isReadonly) { // 不是只读
      // 收集依赖effect
      Track(target, TrackOpType.GET, key)
    }
    if (shallow) {// 浅
      return res
    }

    // 懒代理+递归
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}

function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    // 注意：数组/对象 添加/修改值
    // 获取老值
    const oldValue = target[key]

    // 判断
    let haskey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)

    const result = Reflect.set(target, key, value, receiver)
    
    if (!haskey) { // 没有 新增
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else { // 修改
      if (hasChange(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
// get
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

// set
const set = createSetter()
const shallowSet = createSetter(true)

export const reactiveHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set ${target} on key ${key} failed`);
  }
}

export const readonlyHandlers = extend({
  get: readonlyGet
}, readonlyObj)
export const shallowReadonlyHandlers = extend({
  get: shallowReadonlyGet,
}, readonlyObj)