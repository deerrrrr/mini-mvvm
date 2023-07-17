// 公共方法
function isObject(target) {
    return typeof target === 'object' && target != null;
}
// 合并对象
const extend = Object.assign;
// 判断
const isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
// 判断数组的key是不是整数
const isIntegerKey = (key) => parseInt(key) + '' === key;
// 对象中是否有这个属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const hasChange = (val, oldVal) => val !== oldVal;

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
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// set
const set = createSetter();
const shallowSet = createSetter(true);
const reactiveHandlers = {
    get,
    set
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set ${target} on key ${key} failed`);
    }
};
const readonlyHandlers = extend({
    get: readonlyGet
}, readonlyObj);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readonlyObj);

function reactive(target) {
    return createReactObj(target, false, reactiveHandlers);
}
function shallowReactive(target) {
    return createReactObj(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactObj(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactObj(target, true, shallowReadonlyHandlers);
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

function ref(target) {
    return createRef(target);
}
// 创建类
class RefImpl {
    rawValue;
    shallow;
    // 属性
    _v_isRef = true; // 表识为ref
    _value; // 声明
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
        this._value = rawValue; // 用户传入的值
    }
    // 类的属性访问器
    get value() {
        Track(this, 0 /* TrackOpType.GET */, 'value'); // 收集依赖
        return this._value;
    }
    set value(newVal) {
        if (hasChange(newVal, this._value)) {
            this._value = newVal;
            this.rawValue = newVal;
            trigger(this, 1 /* TriggerOpTypes.SET */, 'value', newVal); // 触发更新
        }
    }
}
function createRef(rawValue, shallow = false) {
    // 返回实例对象
    return new RefImpl(rawValue, shallow);
}
// 实现toRef
function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}
class ObjectRefImpl {
    target;
    key;
    __v_isRef = true;
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(newVal) {
        this.target[this.key] = newVal;
    }
}
// 实现toRefs
function toRefs(target) {
    // 遍历所有属性
    let ret = isArray(target) ? new Array(target.length) : {};
    for (let key in target) {
        ret[key] = toRef(target, key);
    }
    return ret;
}

// 传入函数or对象
function computed(getterOrOptions) {
    // 处理数据
    let getter; // 获取
    let setter; // 设置数据
    if (isFunction(getterOrOptions)) { // 函数
        getter = getterOrOptions;
        setter = () => {
            console.warn('computed value must be readonly');
        };
    }
    else { // 对象
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    // 返回值
    return new ComputedRefImpl(getter, setter);
}
class ComputedRefImpl {
    setter;
    // 定义属性
    _dirty = true; // 默认获取执行,缓存机制
    _value;
    effect;
    constructor(getter, setter) {
        this.setter = setter;
        // 收集依赖
        this.effect = effect(getter, {
            lazy: true,
            changeDirty: () => {
                if (!this._dirty) {
                    this._dirty = true;
                }
            }
        });
    }
    get value() {
        // 获取执行
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false; // 缓存机制
        }
        return this._value;
    }
    set value(newValue) {
        this.setter(newValue);
    }
}

export { computed, effect, reactive, readonly, ref, shallowReactive, shallowReadonly, toRef, toRefs };
//# sourceMappingURL=reactivity.esm-bundler.js.map
