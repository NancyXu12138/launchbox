#!/usr/bin/env node

/**
 * Dify API 测试脚本
 * 测试dify生图API是否可以正常工作
 */

const https = require('https');
const http = require('http');

// API配置
const DIFY_CONFIG = {
  baseUrl: 'http://dify.garenanow.com/v1',
  apiKey: 'app-hH1FffISrV0a9IUiatA2Z5aa',
  user: 'test-user-' + Date.now()
};

// 测试用的活动策划输入
const TEST_INPUT = `
活动主题：玩家共创活动

故事背景：在游戏世界的极寒之地，传说中最坚固的"冰墙"将迎来新生，玩家被邀请成为设计师，通过创意和智慧设计全新的"冰墙"皮肤，最终的设计将永久留在游戏中，成为玩家共同的骄傲。

视觉风格：冰蓝色调结合玩家投稿的多样化设计元素，UI风格需简洁清晰，突出设计主题。

情感连接：通过玩家设计与游戏的深度结合，激发创作热情，满足高活跃玩家对个性化内容的追求。

详细页面布局与交互设计：
活动主页（首屏）
页面标题：玩家共创活动
布局结构：
- 顶部区域（15%）：
  * 活动标题：大号字体显示"玩家共创活动"
  * 倒计时：剩余时间显示，格式"XX天XX小时XX分"
  * 规则按钮：点击弹出规则说明弹窗
  * 返回按钮：点击返回游戏主界面
  
- 中央核心区域（60%）：
  * 主要内容展示：设计投稿区域，展示玩家作品
  * 参与按钮：大型CTA按钮，点击开始设计投稿
  * 进度显示：当前投稿数量，投票进度条
  * 奖励预览：可获得的奖励图标展示，点击查看详情
  
- 右侧信息栏（20%）：
  * 个人信息：头像、昵称、当前积分
  * 排行榜入口：点击进入排行榜页面
  * 好友动态：好友参与情况，点击查看详情
  * 每日任务：3个每日任务，点击查看任务详情
  
- 底部功能区（5%）：
  * 活动商店：点击进入商店页面
  * 分享功能：点击弹出分享选项
  * 客服帮助：点击联系客服

请为这个玩家共创活动生成一个高保真的游戏UI设计图。
`;

/**
 * 发送HTTP请求
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : https;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.headers['content-type']?.includes('application/json')) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data)
            });
          } else {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * 测试基础连接
 */
async function testConnection() {
  console.log('🔍 测试1: 检查API连接...');
  
  try {
    const url = new URL(DIFY_CONFIG.baseUrl + '/info');
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ API连接成功');
      console.log('📋 应用信息:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('❌ API连接失败:', response.statusCode, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 连接错误:', error.message);
    return false;
  }
}

/**
 * 测试发送消息（阻塞模式）
 */
async function testBlockingMessage() {
  console.log('\n🔍 测试2: 发送消息（阻塞模式）...');
  
  try {
    const url = new URL(DIFY_CONFIG.baseUrl + '/chat-messages');
    const payload = {
      inputs: {},
      query: TEST_INPUT,
      response_mode: 'blocking',
      user: DIFY_CONFIG.user
    };
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('📤 发送请求...');
    const response = await makeRequest(options, JSON.stringify(payload));
    
    if (response.statusCode === 200) {
      console.log('✅ 消息发送成功');
      console.log('📋 响应数据:');
      console.log('- 消息ID:', response.data.message_id);
      console.log('- 会话ID:', response.data.conversation_id);
      console.log('- 回答长度:', response.data.answer?.length || 0, '字符');
      
      // 检查是否有图片文件
      if (response.data.message_files && response.data.message_files.length > 0) {
        console.log('🖼️ 发现图片文件:');
        response.data.message_files.forEach((file, index) => {
          console.log(`  图片${index + 1}:`, {
            id: file.id,
            type: file.type,
            url: file.url
          });
        });
      } else {
        console.log('⚠️ 未发现图片文件');
      }
      
      return {
        success: true,
        conversationId: response.data.conversation_id,
        messageId: response.data.message_id,
        answer: response.data.answer,
        files: response.data.message_files || []
      };
    } else {
      console.log('❌ 消息发送失败:', response.statusCode);
      console.log('错误信息:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ 发送消息错误:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试流式消息
 */
async function testStreamingMessage() {
  console.log('\n🔍 测试3: 发送消息（流式模式）...');
  
  return new Promise((resolve) => {
    try {
      const url = new URL(DIFY_CONFIG.baseUrl + '/chat-messages');
      const payload = {
        inputs: {},
        query: TEST_INPUT,
        response_mode: 'streaming',
        user: DIFY_CONFIG.user + '-stream'
      };
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        console.log('📡 开始接收流式数据...');
        
        let messageFiles = [];
        let fullAnswer = '';
        let conversationId = '';
        let messageId = '';
        
        res.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                switch (data.event) {
                  case 'message':
                    fullAnswer += data.answer || '';
                    conversationId = data.conversation_id;
                    messageId = data.message_id;
                    process.stdout.write('.');
                    break;
                    
                  case 'message_file':
                    console.log(`\n🖼️ 发现图片文件: ${data.type} - ${data.url}`);
                    messageFiles.push({
                      id: data.id,
                      type: data.type,
                      url: data.url,
                      belongs_to: data.belongs_to
                    });
                    break;
                    
                  case 'message_end':
                    console.log('\n✅ 流式消息接收完成');
                    console.log('- 消息ID:', messageId);
                    console.log('- 会话ID:', conversationId);
                    console.log('- 回答长度:', fullAnswer.length, '字符');
                    console.log('- 图片数量:', messageFiles.length);
                    
                    resolve({
                      success: true,
                      conversationId,
                      messageId,
                      answer: fullAnswer,
                      files: messageFiles
                    });
                    return;
                    
                  case 'error':
                    console.log('\n❌ 流式消息错误:', data.message);
                    resolve({ success: false, error: data.message });
                    return;
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        });
        
        res.on('end', () => {
          if (messageFiles.length === 0 && fullAnswer.length === 0) {
            console.log('\n⚠️ 流式消息结束，但未收到完整数据');
            resolve({ success: false, error: '未收到完整数据' });
          }
        });
        
        res.on('error', (error) => {
          console.log('\n❌ 流式响应错误:', error.message);
          resolve({ success: false, error: error.message });
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ 流式请求错误:', error.message);
        resolve({ success: false, error: error.message });
      });
      
      req.write(JSON.stringify(payload));
      req.end();
      
    } catch (error) {
      console.log('❌ 流式消息设置错误:', error.message);
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * 下载并验证图片
 */
async function downloadImage(imageUrl) {
  console.log(`\n🔍 测试4: 下载图片验证...`);
  console.log('图片URL:', imageUrl);
  
  try {
    const url = new URL(imageUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET'
    };
    
    const protocol = url.protocol === 'https:' ? https : http;
    
    return new Promise((resolve) => {
      const req = protocol.request(options, (res) => {
        let imageData = Buffer.alloc(0);
        
        res.on('data', (chunk) => {
          imageData = Buffer.concat([imageData, chunk]);
        });
        
        res.on('end', () => {
          console.log('✅ 图片下载成功');
          console.log('- 状态码:', res.statusCode);
          console.log('- 内容类型:', res.headers['content-type']);
          console.log('- 文件大小:', imageData.length, 'bytes');
          console.log('- 文件大小:', (imageData.length / 1024).toFixed(2), 'KB');
          
          // 验证是否为有效图片（检查文件头）
          const isValidImage = imageData.length > 0 && (
            imageData.subarray(0, 4).toString('hex') === '89504e47' || // PNG
            imageData.subarray(0, 2).toString('hex') === 'ffd8' || // JPEG
            imageData.subarray(0, 6).toString('ascii') === 'GIF87a' || // GIF87a
            imageData.subarray(0, 6).toString('ascii') === 'GIF89a'    // GIF89a
          );
          
          if (isValidImage) {
            console.log('✅ 图片格式验证通过');
          } else {
            console.log('⚠️ 图片格式可能异常');
          }
          
          resolve({
            success: res.statusCode === 200,
            size: imageData.length,
            contentType: res.headers['content-type'],
            isValidImage
          });
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ 图片下载错误:', error.message);
        resolve({ success: false, error: error.message });
      });
      
      req.end();
    });
  } catch (error) {
    console.log('❌ 图片URL解析错误:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试 Dify API...\n');
  console.log('配置信息:');
  console.log('- Base URL:', DIFY_CONFIG.baseUrl);
  console.log('- API Key:', DIFY_CONFIG.apiKey.substring(0, 10) + '...');
  console.log('- User ID:', DIFY_CONFIG.user);
  console.log('\n' + '='.repeat(60));
  
  // 测试1: 基础连接
  const connectionTest = await testConnection();
  if (!connectionTest) {
    console.log('\n❌ 基础连接失败，终止测试');
    return;
  }
  
  // 测试2: 阻塞模式消息
  const blockingResult = await testBlockingMessage();
  
  // 测试3: 流式模式消息
  const streamingResult = await testStreamingMessage();
  
  // 测试4: 图片下载验证
  let imageTest = null;
  const testResult = blockingResult.success ? blockingResult : streamingResult;
  
  if (testResult.success && testResult.files && testResult.files.length > 0) {
    imageTest = await downloadImage(testResult.files[0].url);
  }
  
  // 输出测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结:');
  console.log('✅ API连接:', connectionTest ? '成功' : '失败');
  console.log('✅ 阻塞模式:', blockingResult.success ? '成功' : '失败');
  console.log('✅ 流式模式:', streamingResult.success ? '成功' : '失败');
  console.log('✅ 图片生成:', (testResult.files && testResult.files.length > 0) ? '成功' : '失败');
  console.log('✅ 图片下载:', imageTest?.success ? '成功' : '失败');
  
  if (testResult.success && testResult.files && testResult.files.length > 0) {
    console.log('\n🎉 Dify API 测试成功！');
    console.log('📸 生成的图片URL:', testResult.files[0].url);
    console.log('💡 可以将此API集成到Event Planner中用于生成高保真设计图');
  } else {
    console.log('\n⚠️ Dify API 测试部分成功');
    console.log('💡 API可以连接，但图片生成功能可能需要进一步配置');
  }
  
  console.log('\n🔧 集成建议:');
  console.log('1. 使用流式模式获得更好的用户体验');
  console.log('2. 监听 message_file 事件获取生成的图片');
  console.log('3. 将图片URL直接用于前端显示');
  console.log('4. 可以替换现有的GPT图片生成API');
}

// 运行测试
runTests().catch(console.error);
