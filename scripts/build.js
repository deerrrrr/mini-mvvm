// 进行打包 monerepo
// 获取打包目录
const fs = require('fs');
const execa = require('execa');

// 拿到目录
const dirs = fs.readdirSync('packages').filter(p => {
  if (!fs.statSync(`packages/${p}`).isDirectory()) {
    return false
  }
  return true
})

// 并行打包
async function build(target) {
  console.log(target, 111);
  // -c表示执行rollup配置文件rollup.config.js   环境变量
  await execa('rollup', ['-c', "--environment", `TARGET:${target}`], { stdio: 'inherit' }) // 子进程的输出在父包输出
}
// 并发
async function runParaller(dirs, itemfn) {
  // 遍历
  let result = []
  for (let item of dirs) {
    result.push(itemfn(item))
  }
  return Promise.all(result)
}
runParaller(dirs, build).then(() => {
  console.log('成功');
})
// console.log(dirs);