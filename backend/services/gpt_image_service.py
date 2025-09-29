"""
GPT图像生成服务
使用Compass API调用GPT图像生成模型
"""
import base64
import httpx
from typing import Dict, Any, Optional
from config import config
from openai import AsyncOpenAI

class GPTImageService:
    """GPT图像生成服务"""
    
    def __init__(self):
        """初始化GPT图像生成客户端"""
        self.client = AsyncOpenAI(
            api_key=config.OPENAI_API_KEY,
            base_url=config.OPENAI_BASE_URL
        )
        self.model = "gpt-image-1"  # 根据用户要求使用gpt-image-1模型
    
    async def generate_image(
        self, 
        prompt: str, 
        width: int = 1536, 
        height: int = 1024
    ) -> Dict[str, Any]:
        """生成图像"""
        try:
            print(f"开始生成图像，提示词: {prompt}")
            
            # 使用OpenAI的images.generate API
            response = await self.client.images.generate(
                model=self.model,
                prompt=prompt,
                n=1,
                size=f"{width}x{height}"
            )
            
            print(f"GPT API响应成功，生成了 {len(response.data)} 张图像")
            print(f"响应数据: {response.data[0] if response.data else 'No data'}")
            
            if response.data and len(response.data) > 0:
                image_data = response.data[0]
                
                # 检查是否有URL字段
                if hasattr(image_data, 'url') and image_data.url:
                    # 下载图像并转换为base64
                    async with httpx.AsyncClient() as client:
                        img_response = await client.get(image_data.url)
                        if img_response.status_code == 200:
                            # 将图像数据转换为base64
                            image_base64_data = base64.b64encode(img_response.content).decode('utf-8')
                            image_base64 = f"data:image/png;base64,{image_base64_data}"
                            
                            return {
                                "success": True,
                                "image_base64": image_base64,
                                "text": f"已成功生成图像：{prompt}"
                            }
                        else:
                            return {
                                "success": False,
                                "error": f"下载图像失败: {img_response.status_code}"
                            }
                # 检查是否有b64_json字段（base64编码的图像数据）
                elif hasattr(image_data, 'b64_json') and image_data.b64_json:
                    image_base64 = f"data:image/png;base64,{image_data.b64_json}"
                    return {
                        "success": True,
                        "image_base64": image_base64,
                        "text": f"已成功生成图像：{prompt}"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"API响应格式不支持，可用字段: {dir(image_data)}"
                    }
            else:
                return {
                    "success": False,
                    "error": "API响应中未找到图像数据"
                }
                
        except Exception as e:
            error_message = f"生成图像时发生错误: {str(e)}"
            print(error_message)
            return {
                "success": False,
                "error": error_message
            }

# 创建全局实例
gpt_image_service = GPTImageService()
