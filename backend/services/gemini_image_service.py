"""
Gemini图像生成服务
使用Compass API调用Imagen模型生成图像
"""
import base64
import httpx
from typing import Dict, Any, Optional
from config import config

class GeminiImageService:
    """Gemini图像生成服务"""
    
    def __init__(self):
        """初始化Gemini图像生成客户端"""
        self.api_key = config.OPENAI_API_KEY
        self.base_url = config.OPENAI_BASE_URL
        self.model = "gemini-2.5-flash-image-preview"  # 根据用户最新提供的示例
    
    async def generate_image(
        self, 
        prompt: str, 
        width: int = 1024, 
        height: int = 1024
    ) -> Dict[str, Any]:
        """生成图像"""
        try:
            print(f"开始生成图像，提示词: {prompt}")
            
            # 根据用户提供的API调用格式，使用generate_images端点
            async with httpx.AsyncClient() as client:
                # 使用generate_content端点，根据用户最新示例
                response = await client.post(
                    f"{self.base_url}/models/{self.model}:generateContent",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "contents": [
                            {
                                "role": "user",
                                "parts": [
                                    {
                                        "text": f"Generate an image: {prompt}"
                                    }
                                ]
                            }
                        ],
                        "generationConfig": {
                            "response_modalities": ["TEXT", "IMAGE"]
                        }
                    },
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"Gemini API错误响应: {response.status_code} - {error_text}")
                    return {
                        "success": False,
                        "error": f"API请求失败: {response.status_code} - {error_text}"
                    }
                
                data = response.json()
                print(f"Gemini API响应: {data}")
                
                # 解析generate_content API的响应格式
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    content = candidate.get("content", {})
                    parts = content.get("parts", [])
                    
                    text_content = ""
                    image_base64 = None
                    
                    for part in parts:
                        if "text" in part:
                            text_content += part["text"]
                        elif "inlineData" in part:
                            # 处理内联图像数据 - 注意是inlineData不是inline_data
                            inline_data = part["inlineData"]
                            if "data" in inline_data:
                                mime_type = inline_data.get("mimeType", "image/png")
                                image_data = inline_data["data"]
                                
                                # 图像数据已经是base64格式
                                image_base64 = f"data:{mime_type};base64,{image_data}"
                    
                    if image_base64:
                        return {
                            "success": True,
                            "image_base64": image_base64,
                            "text": text_content or f"已成功生成图像：{prompt}"
                        }
                    else:
                        return {
                            "success": True,
                            "image_base64": None,
                            "text": text_content or f"处理了图像生成请求：{prompt}"
                        }
                
                # 如果没有有效数据，返回错误
                return {
                    "success": False,
                    "error": f"API响应中未找到有效数据: {data}"
                }
                
        except Exception as e:
            error_message = f"生成图像时发生错误: {str(e)}"
            print(error_message)
            return {
                "success": False,
                "error": error_message
            }

# 创建全局实例
gemini_image_service = GeminiImageService()
