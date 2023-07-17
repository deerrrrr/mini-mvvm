import { isFunction, isObject, ShapeFlags } from '@vue/shared'
import {componentPublicInstance} from './componentPublicInstance'
export const createComponentInstance = (vnode) => {
  // 就是一个对象
  const instance = {
    vnode,
    type:vnode.type,//组件的类型
    props: {},//组件的属性
    attrs: {},
    setupState: {},//setup返回值
    ctx: {},//代理
    proxy: {},
    data: {},
    render:false,
    isMounted:false,//是否挂载
  }
  instance.ctx = {_:instance}
  return instance
}
export const setupComponent = (instance) => {
  // 设置值
  const {props,children} = instance.vnode
  // 根据props解析到组件实例上
  instance.props = props
  instance.children = children //插槽
  // 判断组件有没有setup
  let shapeFlag = instance.vnode.shapeFlag&&ShapeFlags.STATEFUL_COMPONENT
  if(shapeFlag){
    setupStateComponent(instance)
  } else {// 没有setup
    
  }
}
// 参数（props context） 返回值（对象，函数）
function setupStateComponent(instance) {
  // 代理
  instance.proxy = new Proxy(instance.ctx, componentPublicInstance as any)
  let component = instance.type
  let { setup } = component

  if (setup) {
    let setupContext = createContext(instance)
    let setupResult = setup(instance.props, setupContext)
    handlerSetupResult(instance,setupResult)
  } else {
    // 没有setup，调用render
    finishComponentSetup(instance)
  }
  // 处理render
  // component.render(instance.proxy)
}

// 处理setup返回结果
function handlerSetupResult(instance,setupResult) {
  // 1对象 2函数
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  // 走render
  finishComponentSetup(instance)
}

// 处理render
function finishComponentSetup(instance) {
  // 判断组件有没有render
  let component = instance.type
  if (!instance.render) {
    if (!component.render && component.template) {
      
    }
    instance.render = component.render
  }
}

function createContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => { },
    expose: () => { },
  }
}
