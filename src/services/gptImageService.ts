/**
 * GPT图像生成服务
 * 使用Compass API调用GPT图像生成模型
 */

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  text?: string;
  error?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

class GPTImageService {
  private readonly model: string;

  constructor() {
    // 使用GPT图像生成模型
    this.model = 'gpt-image-1';
  }

  /**
   * 检测用户输入是否包含生图请求
   */
  public isImageGenerationRequest(text: string): boolean {
    const imageKeywords = [
      '生图', '画图', '生成图片', '生成图像', '画一个', '画一张',
      '生成一张图', '生成一幅图', '画出', '绘制', '创建图片',
      'generate image', 'create image', 'draw', 'generate picture'
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * 提取图像生成的提示词
   */
  public extractImagePrompt(text: string): string {
    // 移除生图相关的触发词，保留描述内容
    let prompt = text;
    
    const triggerWords = [
      '帮我生图', '帮我画图', '生成图片', '生成图像', '画一个', '画一张',
      '生成一张图', '生成一幅图', '画出', '绘制', '创建图片',
      'generate image', 'create image', 'draw', 'generate picture'
    ];
    
    triggerWords.forEach(word => {
      prompt = prompt.replace(new RegExp(word, 'gi'), '').trim();
    });
    
    // 如果提取后的prompt为空，使用原文
    if (!prompt) {
      prompt = text;
    }
    
    return prompt;
  }

  /**
   * 生成图像（通过后端API）
   */
  public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      console.log('开始生成图像，提示词:', request.prompt);
      
      // 调用后端API而不是直接调用Compass API
      const response = await fetch('http://localhost:8001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: 1536,
          height: 1024
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('后端API错误响应:', response.status, errorText);
        return {
          success: false,
          error: `后端API请求失败: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      console.log('后端API响应:', data);

      if (data.success && data.image_base64) {
        return {
          success: true,
          imageBase64: data.image_base64,
          text: data.text || `已成功生成图像：${request.prompt}`,
        };
      } else {
        return {
          success: false,
          error: data.error || '生成图像失败'
        };
      }

    } catch (error) {
      console.error('生成图像时发生错误:', error);
      return {
        success: false,
        error: `生成图像失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 流式生成图像（如果API支持）
   */
  public async generateImageStream(
    request: ImageGenerationRequest,
    onProgress: (progress: string) => void,
    onComplete: (result: ImageGenerationResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      onProgress('正在连接GPT图像生成服务...');
      
      const result = await this.generateImage(request);
      
      if (result.success) {
        onProgress('图像生成完成！');
        onComplete(result);
      } else {
        onError(result.error || '生成图像失败');
      }
    } catch (error) {
      onError(`生成图像时发生错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const gptImageService = new GPTImageService();
