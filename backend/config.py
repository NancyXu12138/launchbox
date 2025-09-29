"""
Backend configuration management
"""
import os
from typing import Optional

class Config:
    """Application configuration"""
    
    # Compass API Configuration - SECURE: Only in backend
    OPENAI_API_KEY: str = "245272a341f7615b103ead37708c5f2fc206b340087df732b47ed8a34fab015d"
    OPENAI_MODEL: str = "gpt-4o"  # 当前使用GPT-4o，如需更强策划能力可改为"gpt-5"
    OPENAI_BASE_URL: str = "https://compass.llm.shopee.io/compass-api/v1"
    
    # Server Configuration
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    DEBUG: bool = True
    
    # Development Configuration
    USE_MOCK_OPENAI: bool = False  # Set to True for testing without real API
    
    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:5174"
    
    @classmethod
    def get_openai_config(cls) -> dict:
        """Get OpenAI configuration"""
        return {
            "api_key": cls.OPENAI_API_KEY,
            "model": cls.OPENAI_MODEL,
            "base_url": cls.OPENAI_BASE_URL
        }

# Global config instance
config = Config()
