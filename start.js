const { exec } = require('child_process');

// 检查环境
const isProduction = process.env.NODE_ENV === 'production';
console.log(`正在启动应用 (环境: ${isProduction ? '生产环境' : '开发环境'})`);

// 设置环境变量
process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://redis-ctl-api.onrender.com';
console.log(`后端API地址: ${process.env.BACKEND_URL}`);

// 根据环境选择启动命令
const command = isProduction 
  ? 'node server.cjs'
  : 'npm run preview';

console.log(`执行命令: ${command}`);

// 启动应用
const child = exec(command);

// 输出子进程日志
child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('exit', (code) => {
  console.log(`子进程退出，退出码: ${code}`);
}); 