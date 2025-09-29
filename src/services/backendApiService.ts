/**
 * Backend API service for OpenAI integration
 * 安全注意：API Key只存在于后端，前端不包含任何敏感信息
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class BackendApiService {
  private baseUrl: string;
  private ws: WebSocket | null = null;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * 测试后端API连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  /**
   * 测试OpenAI API连接
   */
  async testOpenAI(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test-openai`);
      const data = await response.json();
      return {
        success: data.status === 'success',
        message: data.message,
        error: data.error
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 非流式聊天完成
   */
  async getChatCompletion(
    messages: ChatMessage[],
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 流式聊天完成（WebSocket）
   */
  async* streamChatCompletion(
    messages: ChatMessage[],
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): AsyncGenerator<string> {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/chat';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // 发送消息到后端
        this.ws?.send(JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens
        }));
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
              // 可以在这里处理状态消息
              console.log('Status:', data.message);
              break;
              
            case 'stream_start':
              console.log('Stream started');
              break;
              
            case 'stream_chunk':
              // 这是我们需要yield的内容
              if (data.content) {
                // 由于我们在Promise中，需要用不同的方式处理
                // 这里我们通过自定义事件来传递数据
                window.dispatchEvent(new CustomEvent('chat-chunk', { 
                  detail: data.content 
                }));
              }
              break;
              
            case 'stream_complete':
              console.log('Stream completed');
              this.ws?.close();
              resolve();
              break;
              
            case 'error':
              console.error('WebSocket error:', data.message);
              reject(new Error(data.message));
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          reject(error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        resolve();
      };
    });
  }

  /**
   * 简化的流式聊天（使用事件监听）
   */
  async startStreamingChat(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<void> {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/chat';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'stream_chunk':
              if (data.content) {
                onChunk(data.content);
              }
              break;
              
            case 'stream_complete':
              this.ws?.close();
              onComplete();
              break;
              
            case 'error':
              onError(data.message);
              break;
          }
        } catch (error) {
          onError('Error parsing server response');
        }
      };

      this.ws.onerror = () => {
        onError('WebSocket connection failed');
      };

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 关闭WebSocket连接
   */
  closeConnection(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// 全局服务实例
export const backendApiService = new BackendApiService();
