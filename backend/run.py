"""
Backend server runner
"""
import uvicorn
from main import app
from config import config

if __name__ == "__main__":
    print(f"🚀 Starting LaunchBox Backend Server...")
    print(f"📡 Server: http://{config.HOST}:{config.PORT}")
    print(f"🔗 WebSocket: ws://{config.HOST}:{config.PORT}/ws/chat")
    print(f"🎯 Frontend URL: {config.FRONTEND_URL}")
    print(f"✅ OpenAI API: {'Configured' if config.OPENAI_API_KEY else 'Not Configured'}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info"
    )
