# 仿 vue3 的简易 mvvm 框架

#### 项目介绍

通过阅读 vue3 源码，仿照实现简易 mvvm 框架，实现的功能有：

1. 采用 proxy 进行的数据劫持
2. 基于发布订阅思想的 effect 方法
3. 响应式相关：reactive（Object）、ref（普通数据类型）
4. computed 功能
5. 虚拟 Dom
6. Render 方法、h 函数
7. Diff 算法
8. 生命周期

#### 使用说明

1. 下载相关依赖环境 命令：yarn
2. 打包运行项目 命令：npm run build 生成各模块 dist 文件夹
3. 运行模块功能，首先将 scripts/dev.js 文件中 build('xxx')中 xxx 改为将要运行的模块名称，后执行命令：npm run dev
4. 在 packages/examples 包下新建 html 文件，导入相关 global.js 文件即可使用

#### 模块介绍（packages 包下）

1. examples：测试各模块的例子
2. reactivity：实现响应式相关的功能
3. shared：公共模块，封装公用方法
4. runtime-dom：dom 操作模块
5. runtime-core：页面渲染相关模块
