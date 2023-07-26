import { ShapeFlags } from '@vue/shared'
import { apiCreateApp } from './apiCreateApp'
import { CVnode, TEXT } from './vnode'
import { effect } from '@vue/reactivity'
import { createComponentInstance, setupComponent } from './component'
export function createRender(renderOptionDom) {
  // 获取全部的dom操作
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProps: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    // createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = renderOptionDom

  function setupRenderEffect(instance, container) {
    // 创建effect
    effect(function componentEffect() {
      // 第一次加载
      if (!instance.isMounted) {
        // 获取render返回值
        let proxy = instance.proxy
        // 执行render
        let subTree = (instance.subTree = instance.render.call(proxy, proxy)) //虚拟dom
        patch(null, subTree, container)
        instance.isMounted = true
      } else {
        // 新旧比对
        let proxy = instance.proxy
        // 旧的vnode
        const prevTree = instance.subTree
        const nextTree = instance.render.call(proxy, proxy)
        instance.subTree = nextTree
        patch(prevTree, nextTree, container)
      }
    })
  }
  // 实现渲染
  const mountComponent = (InitialVnode, container) => {
    // 组件渲染
    // 组件实例
    const instance = (InitialVnode.component =
      createComponentInstance(InitialVnode))
    // 解析数据到这个实现对象中
    setupComponent(instance)
    // 创建effect让render函数执行
    setupRenderEffect(instance, container)
  }
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // 第一次
      mountComponent(n2, container)
    } else {
      //更新
    }
  }

  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }
  function mountChildren(el, children) {
    for (let i = 0; i < children.length; i++) {
      let child = CVnode(children[i])
      patch(null, child, el)
    }
  }
  function mountElement(vnode, container,ancher) {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode
    // 创建元素
    let el = (vnode.el = hostCreateElement(type))
    // 添加属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 处理children
    if (children) {
      if (shapeFlag && ShapeFlags.TEXT_CHILDREN) {
        // 创建文本元素
        hostSetElementText(el, children)
      } else if (shapeFlag && ShapeFlags.ARRAY_CHILDREN) {
        // 递归 patch
        mountChildren(el, children)
      }
    }
    // 插入到对应位置
    hostInsert(el, container,ancher)
  }
  function patchProps(el, oldProps, newProps) {
    // 旧的有 新的没
    if (oldProps != newProps) {
      for (let key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        if (prev != next) {
          // 不同进行替换
          hostPatchProp(el, key, prev, next)
        }
      }
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }
  function patchKeyChild(c1, c2, el) {
    // vue2 双指针
    // vue3 从头部开始
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 同一位置比对，两个元素不同就停止
    // 某个数组没有就停止
    while (i <= e1 && i < e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        // 递归
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    // 不一样 从尾部开始
    while (i <= e1 && i < e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        // 递归
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    // 更新
    // 旧的少 新的多
    if (i > e1) {
      // 添加数据
      const nextPros = e2 + 1
      const ancher = nextPros < c2.length ? c2[nextPros].el : null
      while (i <= e2) {
        patch(null, c2[i++], el, ancher)
      }
    } else if(i>e2) {
      // 旧的比新的多
      while (i<=e1) {
        unmount(c1[i++])
      }
    } else {
      let s1 = i
      let s2 = i
      let keyIndexMap = new Map()
      for (let i = s2; i <= e2; i++){
        const childVnode = c2[i]
        keyIndexMap.set(childVnode.key, i)
        // todo
      }
    }
  }
  function patchChild(n1, n2, el) {
    const c1 = n1.children
    const c2 = n2.children
    const prevShapeFlag = n1.shapeFlag
    const newShapeFlag = n2.shapeFlag
    // 1. 新的是文本
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, c2)
    } else {
      // 2. 新的不是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 儿子都是数组
        patchKeyChild(c1, c2, el)
      } else {
        // 旧的是文本
        hostSetElementText(el, '')
        mountChildren(el, c2)
      }
    }
    // 旧的有 新的没有儿子
  }
  function patchElement(n1, n2, container,ancher) {
    // 1. 比对属性
    // 获取真实的节点
    let el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
    // 2. 比对儿子
    patchChild(n1, n2, el)
  }
  function processElement(n1, n2, container,ancher) {
    if (n1 == null) {
      mountElement(n2, container,ancher)
    } else {
      // 同一个元素比对 更新
      patchElement(n1, n2, container,ancher)
    }
  }

  const isSameVnode = (n1, n2) => {
    return n1.type == n2.type && n1.key == n2.key
  }
  const unmount = (vnode) => {
    hostRemove(vnode.el)
  }
  const patch = (n1, n2, container, ancher = null) => {
    // 判断是不是同一个元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    // 针对不同的类型
    let { shapeFlag, type } = n2
    switch (type) {
      case TEXT:
        // 处理文本
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素
          processElement(n1, n2, container,ancher)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 组件
          processComponent(n1, n2, container)
        }
    }
  }
  let render = (vnode, container) => {
    // 组件初始化
    patch(null, vnode, container) //第一次
  }
  return {
    createApp: apiCreateApp(render), // vnode
  }
}
