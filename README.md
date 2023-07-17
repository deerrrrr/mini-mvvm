# 仿vue3的简易mvvm框架

#### 项目介绍

通过阅读vue3源码，仿照实现简易mvvm框架，实现的功能有：

1. 采用proxy进行的数据劫持
2. 基于发布订阅思想的effect方法
3. 响应式相关：reactive（Object）、ref（普通数据类型）
4. computed功能
5. 后续功能会继续补充...

#### 使用说明

1. 下载相关依赖环境 命令：yarn
2. 打包运行项目 命令：npm run build 生成各模块dist文件夹
3. 运行模块功能，首先将scripts/dev.js文件中build('xxx')中xxx改为将要运行的模块名称，后执行命令：npm run dev
4. 在packages/examples包下新建html文件，导入相关global.js文件即可使用

#### 模块介绍（packages包下）

1. examples：测试各模块的例子
2. reactivity：实现响应式相关的功能
3. shared：公共模块，封装公用方法
4. runtime-dom：dom操作模块
5. runtime=core：页面渲染相关模块

#### 项目亮点

1. 采用Monorepo组织代码块，实现模块分离，做到高内聚低耦合
2. 使用proxy进行数据劫持，实现懒代理，提高性能
3. shared模块用于封装公用方法，有利于代码复用
