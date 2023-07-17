// 公共方法
export function isObject(target) {
  return typeof target === 'object' && target != null
}
// 合并对象
export const extend = Object.assign
// 判断
export const isArray = Array.isArray
export const isFunction = (val) => typeof val === 'function'
export const isNumber = (val) => typeof val === 'number'
export const isString = (val) => typeof val === 'string'

// 判断数组的key是不是整数
export const isIntegerKey = (key) => parseInt(key) + '' === key
// 对象中是否有这个属性
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

export const hasChange = (val, oldVal) => val !== oldVal

export * from './shapeFlag'
