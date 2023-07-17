// 进行打包 monerepo
// 获取打包目录
const execa = require('execa');

// 并行打包
async function build(target) {
  console.log(target, 111);
  // execa -c执行rollup配置 环境变量 -w 自动检测
  await execa('rollup', ['-cw', "--environment", `TARGET:${target}`], { stdio: 'inherit' })
}

build('runtime-dom')