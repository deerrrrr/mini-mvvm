// 公共方法
function isObject(target) {
    return typeof target === 'object' && target != null;
}
// 合并对象
const extend = Object.assign;
// 判断
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
const isNumber = (val) => typeof val === 'number';
const isString = (val) => typeof val === 'string';
// 判断数组的key是不是整数
const isIntegerKey = (key) => parseInt(key) + '' === key;
// 对象中是否有这个属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const hasChange = (val, oldVal) => val !== oldVal;

export { extend, hasChange, hasOwn, isArray, isFunction, isIntegerKey, isNumber, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
