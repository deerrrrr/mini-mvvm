// 公共方法
function isObject(target) {
    return typeof target === 'object' && target != null;
}
// 合并对象
const extend = Object.assign;
// 判断
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
// 对象中是否有这个属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);

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
        setup(instance.props, setupContext);
    }
    // 处理render
    component.render(instance.proxy);
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
extend({ patchProp }, nodeOps);
// createApp
const createApp = (rootComponent, rootProps) => {
    // 因为有不同的平台
    let app = createRender().createApp(rootComponent, rootProps);
    let { mount } = app;
    app.mount = function (container) {
        // 挂载组件 清空内容
        container = nodeOps.querySelector(container);
        container.innerHTML = '';
        mount(container);
    };
    return app;
};

export { createApp };
//# sourceMappingURL=runtime-dom.esm-bundler.js.map
