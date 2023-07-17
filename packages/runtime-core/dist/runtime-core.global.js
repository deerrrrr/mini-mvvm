var VueRuntimeCore = (function (exports) {
  'use strict';

  // 公共方法
  function isObject(target) {
      return typeof target === 'object' && target != null;
  }
  // 判断
  const isArray = Array.isArray;
  const isString = (val) => typeof val === 'string';

  // 创建vnode 和h函数一样
  const createVnode = (type, props, children = null) => {
      // 区分组件还是元素
      let shapeFlag = isString(type)
          ? 1 /* ShapeFlags.ELEMENT */
          : isObject(type)
              ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
              : 0;
      const vnode = {
          _v_isVnode: true,
          type,
          props,
          children,
          key: props && props.key,
          el: null,
          component: {},
          shapeFlag,
      };
      // 孩子标识
      normalizeChildren(vnode, children);
      return vnode;
  };
  function normalizeChildren(vnode, children) {
      let type = 0;
      if (children == null) ;
      else if (isArray(children)) {
          type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
      }
      else {
          type = 8 /* ShapeFlags.TEXT_CHILDREN */;
      }
      vnode.shapeFlag = vnode.shapeFlag | type;
  }

  function apiCreateApp(render) {
      return function createApp(rootComponent, rootProps) {
          // 说明组件和属性
          let app = {
              _component: rootComponent,
              _props: rootProps,
              _container: null,
              mount(container) {
                  // 挂载位置
                  let vnode = createVnode(rootComponent, rootProps);
                  render(vnode, container);
                  app._container = container;
              },
          };
          return app;
      };
  }

  const createComponentInstance = (vnode) => {
      // 就是一个对象
      const instance = {
          vnode,
          type: vnode.type,
          props: {},
          attrs: {},
          setupState: {},
          ctx: {},
          proxy: {},
          isMounted: false, //是否挂载
      };
      instance.ctx = { _: instance };
      return instance;
  };
  const setupComponent = (instance) => {
      // 设置值
      const { props, children } = instance.vnode;
      // 根据props解析到组件实例上
      instance.props = props;
      instance.children = children; //插槽
      // 判断组件有没有setup
      let shapeFlag = instance.vnode.shapeFlag && 4 /* ShapeFlags.STATEFUL_COMPONENT */;
      if (shapeFlag) {
          setupStateComponent(instance);
      }
  };
  function setupStateComponent(instance) {
      let component = instance.type;
      let { setup } = component;
      setup();
  }

  function createRender(renderOptionDom) {
      // 实现渲染
      const mountComponent = (InitialVnode, container) => {
          // 组件渲染
          // 组件实例
          const instance = (InitialVnode.component =
              createComponentInstance(InitialVnode));
          // 解析数据到这个实现对象中
          setupComponent(instance);
      };
      const processComponent = (n1, n2, container) => {
          if (n1 == null) {
              // 第一次
              mountComponent(n2);
          }
      };
      const patch = (n1, n2, container) => {
          // 针对不同的类型
          let { shapeFlag } = n2;
          if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) ;
          else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
              // 组件
              processComponent(n1, n2);
          }
      };
      let render = (vnode, container) => {
          // 组件初始化
          patch(null, vnode); //第一次
      };
      return {
          createApp: apiCreateApp(render), // vnode
      };
  }

  exports.createRender = createRender;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=runtime-core.global.js.map
