// 操作dom 1节点 2属性

import { createRender } from "@vue/runtime-core";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

// dom全部操作
const renderOptionDom = extend({ patchProp }, nodeOps)
// createApp
export const createApp = (rootComponent, rootProps) => {
  // 因为有不同的平台
  let app = createRender(renderOptionDom).createApp(rootComponent, rootProps)
  let { mount } = app
  app.mount = function (container) {
    // 挂载组件 清空内容
    container = nodeOps.querySelector(container)
    container.innerHTML = ''
    mount(container)
  }
  return app
}

export * from '@vue/runtime-core'

