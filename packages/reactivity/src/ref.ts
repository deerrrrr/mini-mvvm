import { Track, trigger } from "./effect"
import { TrackOpType, TriggerOpTypes } from "./operations"
import { hasChange, isArray } from "@vue/shared"

export function ref(target) {
  return createRef(target)
}

export function shallowRef(target) {
  return createRef(target, true)
}

// 创建类
class RefImpl {
  // 属性
  public _v_isRef = true // 表识为ref
  public _value // 声明
  constructor(public rawValue, public shallow) {
    this._value = rawValue // 用户传入的值
  }
  // 类的属性访问器
  get value() {
    Track(this, TrackOpType.GET, 'value') // 收集依赖
    return this._value
  }
  set value(newVal) {
    if (hasChange(newVal, this._value)) {
      this._value = newVal
      this.rawValue = newVal
      trigger(this, TriggerOpTypes.SET, 'value', newVal) // 触发更新
    }
  }
}

function createRef(rawValue, shallow = false) {
  // 返回实例对象
  return new RefImpl(rawValue, shallow)
}

// 实现toRef
export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

class ObjectRefImpl {
  public __v_isRef = true
  constructor(public target, public key) { }
  get value() {
    return this.target[this.key]
  }
  set value(newVal) {
    this.target[this.key] = newVal
  }
}

// 实现toRefs
export function toRefs(target) {
  // 遍历所有属性
  let ret = isArray(target) ? new Array(target.length) : {}
  for (let key in target) {
    ret[key] = toRef(target, key)
  }
  return ret
}