import { isString, isObject, ShapeFlags, isArray } from '@vue/shared'

// 创建vnode 和h函数一样
export const createVnode = (type, props, children = null) => {
  // 区分组件还是元素
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0
  const vnode = {
    _v_isVnode: true, //是一个vnode节点
    type,
    props,
    children,
    key: props && props.key, //diff算法
    el: null, //和真实的元素对应
    component:{},//实例对象
    shapeFlag,
  }
  // 孩子标识
  normalizeChildren(vnode, children)
  return vnode
}

function normalizeChildren(vnode, children) {
  let type = 0
  if (children == null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.shapeFlag = vnode.shapeFlag | type
}

// 判断是不是虚拟dom
export function isVnode(vnode) {
  return vnode._v_isVnode
}

export const TEXT = Symbol('text')
export function CVnode(child) {
  // 只有文本才需要 h函数不需要
  if (isObject(child)) return child
  return createVnode(TEXT,null,String(child))
}
