// 缓存
export const patchEvent = (el, key, value) => {
  const invokers = el._vei || (el._vei = {})
  const eventName = key.slice(1).toLowerCase()
  const exists = invokers[eventName]
  if (exists && value) { // 新的有 旧的也有
    exists.value = value
  } else {
    if (value) { // 新的有 旧的没有
      let invoker = invokers[eventName] = createInvoker(value)
      el.addEventListener(eventName, invoker)
    } else { //新的没有
      el.removeEventListener(eventName, exists)
      invokers[eventName] = undefined
    }
  }
}

function createInvoker(value) {
  const fn = (e) => {
    fn.value(e)
  }
  fn.value = value
  return fn
}