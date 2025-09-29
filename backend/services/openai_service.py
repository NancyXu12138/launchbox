"""
Compass API service for chat interactions
"""
import json
import asyncio
from typing import AsyncGenerator, List, Dict, Any
from openai import AsyncOpenAI
from config import config

class OpenAIService:
    """Compass API service for chat completions"""
    
    def __init__(self):
        """Initialize Compass client with API key from config"""
        openai_config = config.get_openai_config()
        self.client = AsyncOpenAI(
            api_key=openai_config["api_key"],
            base_url=openai_config["base_url"]
        )
        self.model = openai_config["model"]
    
    async def stream_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 16000
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from OpenAI API
        
        Args:
            messages: List of message objects with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            
        Yields:
            str: Streaming content chunks
        """
        try:
            # Create streaming chat completion
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            # Stream the response (Compass API format)
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, 'content') and delta.content is not None:
                        content = delta.content
                        yield content
                    
        except Exception as e:
            error_message = f"Compass API Error: {str(e)}"
            print(f"Error in stream_chat_completion: {error_message}")
            yield f"❌ {error_message}"
    
    async def get_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 16000
    ) -> Dict[str, Any]:
        """
        Get non-streaming chat completion from OpenAI API
        
        Args:
            messages: List of message objects with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict containing the response
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return {
                "success": True,
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "content": None
            }
    
    def format_messages(self, conversation_history: List[Dict]) -> List[Dict[str, str]]:
        """
        Format conversation history for OpenAI API
        
        Args:
            conversation_history: List of messages from frontend
            
        Returns:
            List of properly formatted messages for OpenAI API
        """
        formatted_messages = []
        
        for message in conversation_history:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            # Map frontend roles to OpenAI roles
            if role == "agent":
                role = "assistant"
            elif role not in ["user", "assistant", "system"]:
                role = "user"
            
            formatted_messages.append({
                "role": role,
                "content": content
            })
        
        return formatted_messages

# Global service instance
openai_service = OpenAIService()
