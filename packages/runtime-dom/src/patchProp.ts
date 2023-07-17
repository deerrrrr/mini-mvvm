import { patchAttr } from "./modules/attr"
import { patchClass } from "./modules/class"
import { patchEvent } from "./modules/event"
import { patchStyle } from "./modules/style"

// 操作属性 策略模式
export const patchProp = (el, key, prevVal, nextVal) => {
  switch (key) {
    case 'class':
      patchClass(el, nextVal)
      break
    case 'style':
      patchStyle(el, prevVal, nextVal)
      break
    default:
      if (/^@[^a-z]/.test(key)) { // 是不是事件
        patchEvent(el, key, nextVal)
      } else {
        patchAttr(el, key, nextVal)
      }
      break
  }
}