import { isFunction } from "@vue/shared";
import { effect } from "./effect";

// 传入函数or对象
export function computed(getterOrOptions) {
  // 处理数据
  let getter; // 获取
  let setter; // 设置数据
  if (isFunction(getterOrOptions)) { // 函数
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value must be readonly');
    }
  } else { // 对象
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  // 返回值
  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
  // 定义属性
  public _dirty = true // 默认获取执行,缓存机制
  public _value
  public effect
  constructor(getter, public setter) {
    // 收集依赖
    this.effect = effect(getter, {
      lazy: true,
      changeDirty: () => { // 修改数据时执行
        if (!this._dirty) {
          this._dirty = true
        }
      }
    })
  }
  get value() {
    // 获取执行
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false // 缓存机制
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}