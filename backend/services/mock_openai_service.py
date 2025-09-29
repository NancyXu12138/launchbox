"""
Mock OpenAI service for testing without real API key
"""
import asyncio
import json
from typing import AsyncGenerator, List, Dict, Any

class MockOpenAIService:
    """Mock OpenAI service for development and testing"""
    
    def __init__(self):
        """Initialize mock service"""
        self.model = "gpt-5 (mock)"
    
    async def stream_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncGenerator[str, None]:
        """
        Mock streaming chat completion
        """
        try:
            # Get the last user message
            user_message = ""
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    user_message = msg.get("content", "")
                    break
            
            # Generate mock response
            mock_response = f"""Hello! This is a mock response from GPT-5. 

You said: "{user_message}"

I'm currently running in mock mode because we're testing the system architecture. Here's what I can tell you:

✅ Backend FastAPI service is running successfully
✅ WebSocket connection is working
✅ Streaming response is functional
✅ Front-end integration is complete

To use the real OpenAI API, please provide a valid API key in the format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

This mock response demonstrates that the entire system architecture is working correctly!"""

            # Simulate streaming by yielding chunks
            words = mock_response.split()
            for i, word in enumerate(words):
                if i == 0:
                    yield word
                else:
                    yield f" {word}"
                
                # Simulate realistic typing speed
                await asyncio.sleep(0.05)
                
        except Exception as e:
            error_message = f"Mock service error: {str(e)}"
            print(f"Error in mock stream_chat_completion: {error_message}")
            yield f"❌ {error_message}"
    
    async def get_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """
        Mock non-streaming chat completion
        """
        try:
            # Get the last user message
            user_message = ""
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    user_message = msg.get("content", "")
                    break
            
            mock_response = f"Mock GPT-5 response to: '{user_message}'. The system is working correctly!"
            
            return {
                "success": True,
                "content": mock_response,
                "usage": {
                    "prompt_tokens": 20,
                    "completion_tokens": 50,
                    "total_tokens": 70
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
        Format conversation history for mock API
        """
        formatted_messages = []
        
        for message in conversation_history:
            role = message.get("role", "user")
            content = message.get("content", "")
            
            # Map frontend roles to API roles
            if role == "agent":
                role = "assistant"
            elif role not in ["user", "assistant", "system"]:
                role = "user"
            
            formatted_messages.append({
                "role": role,
                "content": content
            })
        
        return formatted_messages

# Global mock service instance
mock_openai_service = MockOpenAIService()
