import { ShapeFlags } from '@vue/shared'
import { apiCreateApp } from './apiCreateApp'
import { CVnode,TEXT } from './vnode'
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
        let subTree = instance.render.call(proxy, proxy) //虚拟dom
        patch(null, subTree, container)
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
      hostInsert(n2.el=hostCreateText(n2.children), container)
    }
  }
  function mountChildren(el, children) {
    for (let i = 0; i < children.length; i++) {
      let child = CVnode(children[i])
      patch(null, child, el)
    }
  }
  function mountElement(vnode, container) {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode
    // 创建元素
    let el = hostCreateElement(type)
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
    hostInsert(el, container)
  }
  function processElement(n1, n2, container) {
    if (n1 == null) {
      mountElement(n2, container)
    }
  }

  const patch = (n1, n2, container) => {
    // 针对不同的类型
    let { shapeFlag, type } = n2
    switch (type) {
      case TEXT:
        // 处理文本
        processText(n1,n2,container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 元素
          processElement(n1, n2, container)
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
