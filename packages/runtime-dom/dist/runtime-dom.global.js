var VueRuntimeDom = (function (exports) {
  'use strict';

  // 公共方法
  function isObject(target) {
      return typeof target === 'object' && target != null;
  }
  // 合并对象
  const extend = Object.assign;
  // 判断
  const isArray = Array.isArray;
  const isFunction = (val) => typeof val === 'function';
  const isString = (val) => typeof val === 'string';
  // 判断数组的key是不是整数
  const isIntegerKey = (key) => parseInt(key) + '' === key;
  // 对象中是否有这个属性
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const hasChange = (val, oldVal) => val !== oldVal;

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
  // 判断是不是虚拟dom
  function isVnode(vnode) {
      return vnode._v_isVnode;
  }
  const TEXT = Symbol('text');
  function CVnode(child) {
      // 只有文本才需要 h函数不需要
      if (isObject(child))
          return child;
      return createVnode(TEXT, null, String(child));
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

  function effect(fn, options = {}) {
      const effect = createReactEffect(fn, options);
      // 判断
      if (!options.lazy) {
          effect(); // 默认执行
      }
      return effect;
  }
  let uid = 0; // 用于区分不同的effect
  let activeEffect; //保存当前的effect 给Track可以用
  const effectStack = []; //解决嵌套问题，栈结构
  function createReactEffect(fn, options) {
      const effect = function reactiveEffect() {
          if (!effectStack.includes(effect)) { // 不重复
              // 为解决嵌套问题
              try {
                  effectStack.push(effect);
                  activeEffect = effect;
                  return fn(); // 执行用户的方法
              }
              finally {
                  effectStack.pop();
                  activeEffect = effectStack[effectStack.length - 1];
              }
          }
      };
      effect.id = uid++; // 区别effect
      effect._isEffect = true; // 是不是响应式的effect
      effect.raw = fn; // 保存用户的方法
      effect.options = options; // 保存用户的属性
      return effect;
  }
  // 收集effect
  let targetMap = new WeakMap();
  function Track(target, type, key) {
      if (activeEffect === undefined) { // 没有在effect中使用
          return;
      }
      let depMap = targetMap.get(target);
      if (!depMap) { // 没有这个对象
          targetMap.set(target, (depMap = new Map)); // 添加值
      }
      let dep = depMap.get(key);
      if (!dep) { // 没有属性
          depMap.set(key, (dep = new Set));
      }
      if (!dep.has(activeEffect)) {
          dep.add(activeEffect); //收集effect
      }
  }
  // 触发更新
  function trigger(target, type, key, newValue, oldValue) {
      const depsMap = targetMap.get(target);
      if (!depsMap) {
          return;
      }
      let effectSet = new Set(); // Set结构可以避免重复
      const add = (effectAdd) => {
          if (effectAdd) {
              effectAdd.forEach(effect => effectSet.add(effect));
          }
      };
      if (key === 'length' && isArray(target)) {
          depsMap.forEach((dep, key) => {
              if (key === 'length' || key >= newValue) {
                  add(dep);
              }
          });
      }
      else {
          // 对象
          if (key !== undefined) {
              add(depsMap.get(key));
          }
          // 数组
          switch (type) {
              case 0 /* TriggerOpTypes.ADD */:
                  if (isArray(target) && isIntegerKey(key)) {
                      add(depsMap.get('length'));
                  }
          }
      }
      // 执行 触发effect
      effectSet.forEach((effect) => {
          if (effect.options.changeDirty) { // 不再次get不会执行effect
              effect.options.changeDirty();
          }
          else {
              effect();
          }
      });
  }

  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver);
          if (!isReadonly) { // 不是只读
              // 收集依赖effect
              Track(target, 0 /* TrackOpType.GET */, key);
          }
          if (shallow) { // 浅
              return res;
          }
          // 懒代理+递归
          if (isObject(res)) {
              return isReadonly ? readonly(res) : reactive(res);
          }
          return res;
      };
  }
  function createSetter(shallow = false) {
      return function set(target, key, value, receiver) {
          // 注意：数组/对象 添加/修改值
          // 获取老值
          const oldValue = target[key];
          // 判断
          let haskey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
          const result = Reflect.set(target, key, value, receiver);
          if (!haskey) { // 没有 新增
              trigger(target, 0 /* TriggerOpTypes.ADD */, key, value);
          }
          else { // 修改
              if (hasChange(value, oldValue)) {
                  trigger(target, 1 /* TriggerOpTypes.SET */, key, value);
              }
          }
          return result;
      };
  }
  // get
  const get = createGetter();
  const readonlyGet = createGetter(true);
  const shallowReadonlyGet = createGetter(true, true);
  // set
  const set = createSetter();
  const reactiveHandlers = {
      get,
      set
  };
  let readonlyObj = {
      set: (target, key) => {
          console.warn(`set ${target} on key ${key} failed`);
      }
  };
  const readonlyHandlers = extend({
      get: readonlyGet
  }, readonlyObj);
  extend({
      get: shallowReadonlyGet,
  }, readonlyObj);

  function reactive(target) {
      return createReactObj(target, false, reactiveHandlers);
  }
  function readonly(target) {
      return createReactObj(target, true, readonlyHandlers);
  }
  // 实现代理的核心
  // ！！优化 防止重复代理
  const reactiveMap = new WeakMap(); // key必须是对象，自动的垃圾回收
  const readonlyMap = new WeakMap();
  // 柯里化：根据不同的参数
  function createReactObj(target, isReadonly, baseHandlers) {
      // 如果不是对象
      if (!isObject(target)) {
          return target;
      }
      // 优化
      const proxymap = isReadonly ? readonlyMap : reactiveMap;
      const proxyEs = proxymap.get(target); // 有
      if (proxyEs) {
          return proxyEs;
      }
      const proxy = new Proxy(target, baseHandlers);
      proxymap.set(target, proxy); // 存入
      return proxy;
  }

  const componentPublicInstance = {
      get({ _: instance }, key) {
          // 获取值
          const { props, data, setupState } = instance;
          if (key[0] == "$") { //属性以$开头不可以进行获取
              return;
          }
          if (hasOwn(props, key)) {
              return props[key];
          }
          else if (hasOwn(setupState, key)) {
              return setupState[key];
          }
      },
      set({ _: instance }, key, value) {
          const { props, data, setupState } = instance;
          if (hasOwn(props, key)) {
              props[key] = value;
          }
          else if (hasOwn(setupState, key)) {
              setupState[key] = value;
          }
      }
  };

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
          data: {},
          render: false,
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
  // 参数（props context） 返回值（对象，函数）
  function setupStateComponent(instance) {
      // 代理
      instance.proxy = new Proxy(instance.ctx, componentPublicInstance);
      let component = instance.type;
      let { setup } = component;
      if (setup) {
          let setupContext = createContext(instance);
          let setupResult = setup(instance.props, setupContext);
          handlerSetupResult(instance, setupResult);
      }
      else {
          // 没有setup，调用render
          finishComponentSetup(instance);
      }
      // 处理render
      // component.render(instance.proxy)
  }
  // 处理setup返回结果
  function handlerSetupResult(instance, setupResult) {
      // 1对象 2函数
      if (isFunction(setupResult)) {
          instance.render = setupResult;
      }
      else if (isObject(setupResult)) {
          instance.setupState = setupResult;
      }
      // 走render
      finishComponentSetup(instance);
  }
  // 处理render
  function finishComponentSetup(instance) {
      // 判断组件有没有render
      let component = instance.type;
      if (!instance.render) {
          if (!component.render && component.template) ;
          instance.render = component.render;
      }
  }
  function createContext(instance) {
      return {
          attrs: instance.attrs,
          slots: instance.slots,
          emit: () => { },
          expose: () => { },
      };
  }

  function createRender(renderOptionDom) {
      // 获取全部的dom操作
      const { insert: hostInsert, remove: hostRemove, patchProps: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, 
      // createComment: hostCreateComment,
      setText: hostSetText, setElementText: hostSetElementText, } = renderOptionDom;
      function setupRenderEffect(instance, container) {
          // 创建effect
          effect(function componentEffect() {
              // 第一次加载
              if (!instance.isMounted) {
                  // 获取render返回值
                  let proxy = instance.proxy;
                  // 执行render
                  let subTree = (instance.subTree = instance.render.call(proxy, proxy)); //虚拟dom
                  patch(null, subTree, container);
                  instance.isMounted = true;
              }
              else {
                  // 新旧比对
                  let proxy = instance.proxy;
                  // 旧的vnode
                  const prevTree = instance.subTree;
                  const nextTree = instance.render.call(proxy, proxy);
                  instance.subTree = nextTree;
                  patch(prevTree, nextTree, container);
              }
          });
      }
      // 实现渲染
      const mountComponent = (InitialVnode, container) => {
          // 组件渲染
          // 组件实例
          const instance = (InitialVnode.component =
              createComponentInstance(InitialVnode));
          // 解析数据到这个实现对象中
          setupComponent(instance);
          // 创建effect让render函数执行
          setupRenderEffect(instance, container);
      };
      const processComponent = (n1, n2, container) => {
          if (n1 == null) {
              // 第一次
              mountComponent(n2, container);
          }
      };
      function processText(n1, n2, container) {
          if (n1 == null) {
              hostInsert((n2.el = hostCreateText(n2.children)), container);
          }
      }
      function mountChildren(el, children) {
          for (let i = 0; i < children.length; i++) {
              let child = CVnode(children[i]);
              patch(null, child, el);
          }
      }
      function mountElement(vnode, container) {
          // 递归渲染
          const { props, shapeFlag, type, children } = vnode;
          // 创建元素
          let el = vnode.el = hostCreateElement(type);
          // 添加属性
          if (props) {
              for (let key in props) {
                  hostPatchProp(el, key, null, props[key]);
              }
          }
          // 处理children
          if (children) {
              if (shapeFlag && 8 /* ShapeFlags.TEXT_CHILDREN */) {
                  // 创建文本元素
                  hostSetElementText(el, children);
              }
              else if (shapeFlag && 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                  // 递归 patch
                  mountChildren(el, children);
              }
          }
          // 插入到对应位置
          hostInsert(el, container);
      }
      function processElement(n1, n2, container) {
          if (n1 == null) {
              mountElement(n2, container);
          }
      }
      const isSameVnode = (n1, n2) => {
          return n1.type == n2.type && n1.key == n2.key;
      };
      const unmount = (vnode) => {
          hostRemove(vnode.el);
      };
      const patch = (n1, n2, container) => {
          // 判断是不是同一个元素
          if (n1 && !isSameVnode(n1, n2)) {
              unmount(n1);
              n1 = null;
          }
          // 针对不同的类型
          let { shapeFlag, type } = n2;
          switch (type) {
              case TEXT:
                  // 处理文本
                  processText(n1, n2, container);
                  break;
              default:
                  if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                      // 元素
                      processElement(n1, n2, container);
                  }
                  else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                      // 组件
                      processComponent(n1, n2, container);
                  }
          }
      };
      let render = (vnode, container) => {
          // 组件初始化
          patch(null, vnode, container); //第一次
      };
      return {
          createApp: apiCreateApp(render), // vnode
      };
  }

  function h(type, propsOrChildren, children) {
      const i = arguments.length;
      if (i == 2) {
          if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
              if (isVnode(propsOrChildren)) {
                  return createVnode(type, null, [propsOrChildren]);
              }
              return createVnode(type, propsOrChildren);
          }
          else {
              return createVnode(type, null, propsOrChildren);
          }
      }
      else {
          if (i > 3) {
              children = Array.prototype.slice.call(arguments, 2);
          }
          else if (i === 3 && isVnode(children)) {
              children = [children];
          }
          return createVnode(type, propsOrChildren, children);
      }
  }

  // 操作节点
  const nodeOps = {
      // 创建元素
      createElement: tagName => document.createElement(tagName),
      remove: child => {
          let parent = child.parentNode;
          if (parent) {
              parent.removeChild(child);
          }
      },
      insert: (child, parent, ancher = null) => {
          parent.insertBefore(child, ancher);
      },
      querySelector: select => document.querySelector(select),
      setElementText: (el, text) => el.textContent = text,
      // 文本
      createText: text => document.createTextNode(text),
      setText: (node, text) => node.nodeValue = text
  };

  const patchAttr = (el, key, value) => {
      if (value == null) {
          el.removeAttribute(key);
      }
      else {
          el.removeAttribute(key, value);
      }
  };

  const patchClass = (el, value) => {
      if (value == null) {
          value = '';
      }
      el.className = value;
  };

  // 缓存
  const patchEvent = (el, key, value) => {
      const invokers = el._vei || (el._vei = {});
      const eventName = key.slice(1).toLowerCase();
      const exists = invokers[eventName];
      if (exists && value) { // 新的有 旧的也有
          exists.value = value;
      }
      else {
          if (value) { // 新的有 旧的没有
              let invoker = invokers[eventName] = createInvoker(value);
              el.addEventListener(eventName, invoker);
          }
          else { //新的没有
              el.removeEventListener(eventName, exists);
              invokers[eventName] = undefined;
          }
      }
  };
  function createInvoker(value) {
      const fn = (e) => {
          fn.value(e);
      };
      fn.value = value;
      return fn;
  }

  const patchStyle = (el, prev, next) => {
      const style = el.style;
      if (next == null) {
          el.removeAttribute('style');
      }
      else {
          // 老的有 新的没有
          if (prev) {
              for (let key in prev) {
                  if (next[key] == null) {
                      style[key] = '';
                  }
              }
          }
          // 新的有 
          for (let key in next) {
              style[key] = next[key];
          }
      }
  };

  // 操作属性 策略模式
  const patchProp = (el, key, prevVal, nextVal) => {
      switch (key) {
          case 'class':
              patchClass(el, nextVal);
              break;
          case 'style':
              patchStyle(el, prevVal, nextVal);
              break;
          default:
              if (/^@[^a-z]/.test(key)) { // 是不是事件
                  patchEvent(el, key, nextVal);
              }
              else {
                  patchAttr(el, key, nextVal);
              }
              break;
      }
  };

  // 操作dom 1节点 2属性
  // dom全部操作
  const renderOptionDom = extend({ patchProp }, nodeOps);
  // createApp
  const createApp = (rootComponent, rootProps) => {
      // 因为有不同的平台
      let app = createRender(renderOptionDom).createApp(rootComponent, rootProps);
      let { mount } = app;
      app.mount = function (container) {
          // 挂载组件 清空内容
          container = nodeOps.querySelector(container);
          container.innerHTML = '';
          mount(container);
      };
      return app;
  };

  exports.createApp = createApp;
  exports.createRender = createRender;
  exports.h = h;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
