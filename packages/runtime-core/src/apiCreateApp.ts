import {createVnode} from "./vnode"
export function apiCreateApp(render) {
  return function createApp(rootComponent, rootProps) {
    // 说明组件和属性
    let app = {
      _component: rootComponent,
      _props: rootProps,
      _container:null,
      mount(container) {
        // 挂载位置
        let vnode = createVnode(rootComponent,rootProps)
        render(vnode, container)
        app._container = container
      },
    }
    return app
  }
}
