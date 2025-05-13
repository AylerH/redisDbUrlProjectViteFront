#!/usr/bin/env node

/**
 * Render环境检查和诊断工具
 * 
 * 用法: node checkRenderEnv.js
 * 
 * 这个脚本将检查以下内容:
 * 1. 环境变量配置
 * 2. 网络连接
 * 3. DNS解析
 * 4. 后端API连接
 * 5. 静态文件存在
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// 颜色标记
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 配置
const config = {
  backendUrl: 'https://redis-ctl-api.onrender.com',
  testEndpoints: [
    '/db_redis/health',
    '/db_redis/databases'
  ],
  requiredFiles: [
    'dist/index.html',
    'server.cjs',
    'directRequests.cjs',
    'healthCheck.cjs'
  ],
  dnsServers: [
    'google-public-dns-a.google.com', // 8.8.8.8
    'cloudflare-dns.com'              // 1.1.1.1
  ]
};

/**
 * 打印标题
 */
function printHeader(title) {
  console.log(`\n${colors.cyan}============= ${title} =============${colors.reset}\n`);
}

/**
 * 打印成功消息
 */
function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

/**
 * 打印失败消息
 */
function failure(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

/**
 * 打印警告消息
 */
function warning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

/**
 * 打印信息消息
 */
function info(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * 检查环境变量
 */
function checkEnvironment() {
  printHeader('环境变量检查');
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || '未设置',
    PORT: process.env.PORT || '未设置 (默认: 3000)',
    RENDER: process.env.RENDER || '未设置',
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || '未设置'
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value === '未设置') {
      warning(`${key}: ${value}`);
    } else {
      success(`${key}: ${value}`);
    }
  }
  
  return true;
}

/**
 * 测试HTTP请求
 */
function testHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: endTime - startTime
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
  });
}

/**
 * 检查DNS解析
 */
async function checkDns() {
  printHeader('DNS解析检查');
  
  const domains = [
    'render.com',
    'redis-ctl-api.onrender.com',
    ...config.dnsServers
  ];
  
  const originalServer = dns.getServers()[0];
  info(`当前DNS服务器: ${originalServer}`);
  
  for (const domain of domains) {
    try {
      const result = await new Promise((resolve, reject) => {
        const startTime = Date.now();
        dns.lookup(domain, (err, address) => {
          if (err) {
            reject(err);
            return;
          }
          const endTime = Date.now();
          resolve({
            domain,
            address,
            time: endTime - startTime
          });
        });
      });
      
      success(`${result.domain} -> ${result.address} (${result.time}ms)`);
    } catch (error) {
      failure(`${domain} 解析失败: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * 检查网络连接
 */
async function checkNetworkConnectivity() {
  printHeader('网络连接检查');
  
  const targets = [
    'https://render.com',
    'https://www.google.com',
    'https://registry.npmjs.org',
    config.backendUrl
  ];
  
  for (const url of targets) {
    try {
      const result = await testHttpRequest(url);
      success(`${url} - 状态: ${result.statusCode}, 响应时间: ${result.responseTime}ms`);
    } catch (error) {
      failure(`${url} - 连接失败: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * 检查API连接
 */
async function checkApiConnectivity() {
  printHeader('API连接检查');
  
  for (const endpoint of config.testEndpoints) {
    const url = `${config.backendUrl}${endpoint}`;
    
    try {
      const result = await testHttpRequest(url);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        success(`${endpoint} - 状态: ${result.statusCode}, 响应时间: ${result.responseTime}ms`);
        try {
          const data = JSON.parse(result.data);
          if (Object.keys(data).length > 0) {
            info(`  响应数据: ${JSON.stringify(data).substring(0, 100)}...`);
          }
        } catch (e) {
          // 数据不是JSON格式，跳过
        }
      } else {
        warning(`${endpoint} - 状态: ${result.statusCode}, 响应时间: ${result.responseTime}ms`);
      }
    } catch (error) {
      failure(`${endpoint} - 请求失败: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * 检查文件系统
 */
function checkFileSystem() {
  printHeader('文件系统检查');
  
  const workdir = process.cwd();
  info(`当前工作目录: ${workdir}`);
  
  // 检查必需文件
  for (const file of config.requiredFiles) {
    const fullPath = path.join(workdir, file);
    if (checkFileExists(fullPath)) {
      success(`文件存在: ${file}`);
    } else {
      failure(`文件不存在: ${file}`);
    }
  }
  
  // 检查dist目录
  const distDir = path.join(workdir, 'dist');
  if (checkFileExists(distDir) && fs.statSync(distDir).isDirectory()) {
    const files = fs.readdirSync(distDir);
    success(`dist目录存在，包含 ${files.length} 个文件`);
  } else {
    failure(`dist目录不存在或不是目录`);
  }
  
  return true;
}

/**
 * 生成报告
 */
function generateReport(results) {
  printHeader('诊断报告');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    success('所有检查均已通过！环境配置正常。');
  } else {
    const failed = Object.entries(results)
      .filter(([_, result]) => result !== true)
      .map(([name, _]) => name);
    
    failure(`以下检查失败: ${failed.join(', ')}`);
    
    console.log('\n建议解决方案:');
    
    if (failed.includes('environment')) {
      info('- 确保在Render.com控制面板中配置了必要的环境变量');
    }
    
    if (failed.includes('dns')) {
      info('- DNS解析问题可能是暂时性的，尝试稍后再次检查');
      info('- 您可以尝试在Render.com控制面板中重启服务');
    }
    
    if (failed.includes('network')) {
      info('- 网络连接问题可能是暂时性的，尝试稍后再次检查');
      info('- 检查Render.com状态页，查看是否有已知问题');
    }
    
    if (failed.includes('api')) {
      info('- 检查后端API服务是否在运行');
      info('- 在Render.com控制面板中确认后端服务已启动');
      info('- 检查API URL配置是否正确');
    }
    
    if (failed.includes('filesystem')) {
      info('- 检查是否正确构建了前端应用');
      info('- 确保所有必要文件都包含在部署中');
      info('- 检查Render.com的构建命令配置');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`${colors.magenta}Render环境诊断工具 v1.0.0${colors.reset}`);
  console.log(`运行时间: ${new Date().toISOString()}`);
  console.log(`Node.js版本: ${process.version}`);
  console.log(`平台: ${process.platform}`);
  
  const results = {
    environment: false,
    dns: false,
    network: false,
    api: false,
    filesystem: false
  };
  
  try {
    results.environment = checkEnvironment();
    results.filesystem = checkFileSystem();
    results.dns = await checkDns();
    results.network = await checkNetworkConnectivity();
    results.api = await checkApiConnectivity();
    
    generateReport(results);
  } catch (error) {
    console.error(`${colors.red}诊断过程中发生错误: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行主函数
main(); 