"""
Action执行服务 - 重构版本

统一处理所有 Action 的执行，支持：
1. 代码执行类（calculator, text_processor, json_processor, datetime_processor）
2. API调用类（google_search）
3. LLM任务类（sentiment_analysis, game_classification）
4. 图像生成类（gpt_image_gen）

设计原则：
- 每个 Action 都有明确的输入输出格式
- 统一的错误处理和日志记录
- 安全执行（代码沙箱、参数验证）
"""
import json
import math
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .gpt_image_service import gpt_image_service
from .openai_service import openai_service

class ActionExecutorService:
    """Action执行服务 - 统一管理所有 Action 的执行"""

    def __init__(self):
        """初始化Action执行服务"""
        # 定义 Action ID 到执行函数的映射
        self.action_handlers = {
            # 代码执行类
            'calculator': self._execute_calculator,
            'text_processor': self._execute_text_processor,
            'json_processor': self._execute_json_processor,
            'datetime_processor': self._execute_datetime_processor,
            
            # API调用类
            'google_search': self._execute_google_search,
            
            # LLM任务类
            'sentiment_analysis': self._execute_sentiment_analysis,
            'game_classification': self._execute_game_classification,
            
            # 图像生成类
            'gpt_image_gen': self._execute_image_generation,
            
            # 其他（兼容旧版本）
            '4': self._execute_image_generation,  # 旧版本的图像生成ID
            '8': self._execute_calculator,
            '9': self._execute_text_processor,
            '10': self._execute_json_processor,
            '11': self._execute_datetime_processor,
        }

    async def execute_action(
        self,
        action_id: str,
        action_name: str,
        action_type: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        执行指定的Action
        
        Args:
            action_id: Action ID（如 'calculator', 'gpt_image_gen'）
            action_name: Action 名称（显示用）
            action_type: Action 类型（如 'code_execution', 'image_generation'）
            parameters: 执行参数
            
        Returns:
            执行结果字典，包含 success、data、message 等字段
        """
        try:
            print(f"\n{'='*60}")
            print(f"📋 执行Action: {action_name}")
            print(f"   ID: {action_id}")
            print(f"   类型: {action_type}")
            print(f"   参数: {json.dumps(parameters, ensure_ascii=False)}")
            print(f"{'='*60}\n")

            # 查找对应的处理函数
            handler = self.action_handlers.get(action_id)
            
            if handler:
                # 执行对应的处理函数
                result = await handler(parameters)
                print(f"✅ Action执行成功: {action_name}")
                return result
            else:
                # 未找到处理函数
                print(f"⚠️  未找到Action处理函数: {action_id}")
                return {
                    "success": False,
                    "error": f"不支持的Action ID: {action_id}"
                }

        except Exception as e:
            error_message = f"执行Action时发生错误: {str(e)}"
            print(f"❌ {error_message}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": error_message
            }

    # ==========================================
    # 代码执行类 Actions
    # ==========================================
    
    async def _execute_calculator(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行数学计算
        
        Args:
            parameters: {'expression': '2 + 2'}
            
        Returns:
            {'success': True, 'data': {'result': 4, 'expression': '2 + 2'}}
        """
        expression = parameters.get('expression', '')
        
        if not expression:
            return {
                "success": False,
                "error": "缺少必要参数: expression"
            }
        
        try:
            # 安全的数学计算：只允许数字和基本运算符
            # 移除所有空格
            clean_expr = expression.replace(' ', '')
            
            # 只允许安全的字符
            allowed_pattern = r'^[\d+\-*/().]+$'
            if not re.match(allowed_pattern, clean_expr):
                # 检查是否包含数学函数
                math_functions = ['sqrt', 'sin', 'cos', 'tan', 'log', 'abs', 'pow']
                has_math_func = any(func in expression.lower() for func in math_functions)
                
                if not has_math_func:
                    return {
                        "success": False,
                        "error": "表达式包含非法字符，只支持数字和运算符 (+ - * / ( ))"
                    }
            
            # 使用 eval 执行计算（在受限环境中）
            # 只允许访问 math 模块
            safe_dict = {
                "__builtins__": {},
                "math": math,
                "sqrt": math.sqrt,
                "sin": math.sin,
                "cos": math.cos,
                "tan": math.tan,
                "log": math.log,
                "abs": abs,
                "pow": pow
            }
            
            result = eval(expression, safe_dict)
            
            return {
                "success": True,
                "type": "calculation",
                "data": {
                    "expression": expression,
                    "result": result
                },
                "message": f"计算结果: {result}"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"计算错误: {str(e)}"
            }
    
    async def _execute_text_processor(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行文本处理
        
        Args:
            parameters: {'text': '示例文本', 'operation': 'analyze'}
            
        Operations:
            - analyze: 统计字数、字符数、行数
            - uppercase: 转大写
            - lowercase: 转小写
            - word_count: 仅统计字数
        """
        text = parameters.get('text', '')
        operation = parameters.get('operation', 'analyze')
        
        if not text:
            return {
                "success": False,
                "error": "缺少必要参数: text"
            }
        
        try:
            if operation == 'analyze':
                # 分析统计
                words = len(text.split())
                chars = len(text)
                chars_no_space = len(text.replace(' ', '').replace('\n', ''))
                lines = len(text.split('\n'))
                
                return {
                    "success": True,
                    "type": "text_analysis",
                    "data": {
                        "word_count": words,
                        "char_count": chars,
                        "char_count_no_space": chars_no_space,
                        "line_count": lines,
                        "analysis": f"包含 {words} 个单词，{chars} 个字符（含空格），{chars_no_space} 个字符（不含空格），{lines} 行"
                    },
                    "message": "文本分析完成"
                }
                
            elif operation == 'uppercase':
                return {
                    "success": True,
                    "type": "text_transform",
                    "data": {"result": text.upper()},
                    "message": "已转换为大写"
                }
                
            elif operation == 'lowercase':
                return {
                    "success": True,
                    "type": "text_transform",
                    "data": {"result": text.lower()},
                    "message": "已转换为小写"
                }
                
            elif operation == 'word_count':
                words = len(text.split())
                return {
                    "success": True,
                    "type": "text_analysis",
                    "data": {"word_count": words},
                    "message": f"字数统计: {words} 个单词"
                }
                
            else:
                return {
                    "success": False,
                    "error": f"不支持的操作类型: {operation}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"文本处理错误: {str(e)}"
            }
    
    async def _execute_json_processor(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行JSON处理
        
        Args:
            parameters: {'json_string': '{"key": "value"}', 'operation': 'format'}
            
        Operations:
            - format: 格式化JSON
            - keys: 提取键名
            - count: 统计数量
            - validate: 验证格式
        """
        json_string = parameters.get('json_string', '')
        operation = parameters.get('operation', 'format')
        
        if not json_string:
            return {
                "success": False,
                "error": "缺少必要参数: json_string"
            }
        
        try:
            # 解析JSON
            data = json.loads(json_string)
            
            if operation == 'format':
                # 格式化JSON
                formatted = json.dumps(data, indent=2, ensure_ascii=False)
                return {
                    "success": True,
                    "type": "json_format",
                    "data": {"formatted": formatted},
                    "message": "JSON格式化成功"
                }
                
            elif operation == 'keys':
                # 提取键名
                if isinstance(data, dict):
                    keys = list(data.keys())
                    return {
                        "success": True,
                        "type": "json_keys",
                        "data": {"keys": keys, "count": len(keys)},
                        "message": f"找到 {len(keys)} 个键"
                    }
                else:
                    return {
                        "success": False,
                        "error": "数据不是对象类型，无法提取键名"
                    }
                    
            elif operation == 'count':
                # 统计数量
                if isinstance(data, (dict, list)):
                    count = len(data)
                    type_name = "对象" if isinstance(data, dict) else "数组"
                    return {
                        "success": True,
                        "type": "json_count",
                        "data": {"count": count, "type": type_name},
                        "message": f"{type_name}包含 {count} 个元素"
                    }
                else:
                    return {
                        "success": True,
                        "type": "json_count",
                        "data": {"count": 1, "type": "值"},
                        "message": "这是一个单一值"
                    }
                    
            elif operation == 'validate':
                # 验证格式（如果能解析，就是有效的）
                return {
                    "success": True,
                    "type": "json_validate",
                    "data": {"valid": True},
                    "message": "JSON格式有效"
                }
                
            else:
                return {
                    "success": False,
                    "error": f"不支持的操作类型: {operation}"
                }
                
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"JSON解析错误: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"JSON处理错误: {str(e)}"
            }
    
    async def _execute_datetime_processor(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行日期时间处理
        
        Args:
            parameters: {'operation': 'now', 'date_input': '2024-01-01'}
            
        Operations:
            - now: 获取当前时间
            - parse: 解析日期
            - format: 格式化日期
            - diff: 计算时间差
        """
        operation = parameters.get('operation', 'now')
        date_input = parameters.get('date_input', '')
        
        try:
            if operation == 'now':
                # 获取当前时间
                now = datetime.now()
                return {
                    "success": True,
                    "type": "datetime",
                    "data": {
                        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
                        "timestamp": int(now.timestamp()),
                        "iso_format": now.isoformat(),
                        "weekday": now.strftime("%A"),
                        "weekday_cn": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][now.weekday()]
                    },
                    "message": f"当前时间: {now.strftime('%Y-%m-%d %H:%M:%S')}"
                }
                
            elif operation == 'parse':
                # 解析日期
                if not date_input:
                    return {
                        "success": False,
                        "error": "缺少必要参数: date_input"
                    }
                
                # 尝试多种格式解析
                formats = [
                    "%Y-%m-%d",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y/%m/%d",
                    "%Y/%m/%d %H:%M:%S"
                ]
                
                parsed_date = None
                for fmt in formats:
                    try:
                        parsed_date = datetime.strptime(date_input, fmt)
                        break
                    except:
                        continue
                
                if not parsed_date:
                    return {
                        "success": False,
                        "error": "无法解析日期格式，请使用 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS 格式"
                    }
                
                return {
                    "success": True,
                    "type": "datetime_parse",
                    "data": {
                        "parsed": parsed_date.strftime("%Y-%m-%d %H:%M:%S"),
                        "weekday": parsed_date.strftime("%A"),
                        "timestamp": int(parsed_date.timestamp())
                    },
                    "message": "日期解析成功"
                }
                
            else:
                return {
                    "success": False,
                    "error": f"不支持的操作类型: {operation}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"日期时间处理错误: {str(e)}"
            }
    
    # ==========================================
    # API调用类 Actions
    # ==========================================
    
    async def _execute_google_search(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行Google搜索（Mock实现）
        
        Args:
            parameters: {'query': '搜索关键词', 'max_results': 10}
        """
        query = parameters.get('query', '')
        max_results = parameters.get('max_results', 10)
        
        if not query:
            return {
                "success": False,
                "error": "缺少必要参数: query"
            }
        
        # Mock 搜索结果
        mock_results = [
            {
                "title": f"{query} - 相关结果 1",
                "snippet": "这是一个模拟的搜索结果描述...",
                "url": f"https://example.com/result1?q={query}"
            },
            {
                "title": f"{query} - 相关结果 2",
                "snippet": "另一个模拟的搜索结果，包含相关信息...",
                "url": f"https://example.com/result2?q={query}"
            },
            {
                "title": f"{query} - 深入分析",
                "snippet": "详细的分析和讨论内容...",
                "url": f"https://example.com/result3?q={query}"
            }
        ]
        
        return {
            "success": True,
            "type": "search_results",
            "data": {
                "results": mock_results[:max_results],
                "query": query,
                "total": len(mock_results)
            },
            "message": f"找到 {len(mock_results)} 条搜索结果"
        }
    
    # ==========================================
    # LLM任务类 Actions
    # ==========================================
    
    async def _execute_sentiment_analysis(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行情感分析
        
        Args:
            parameters: {'text': '这个游戏太好玩了！'}
        """
        text = parameters.get('text', '')
        
        if not text:
            return {
                "success": False,
                "error": "缺少必要参数: text"
            }
        
        try:
            # 调用LLM进行情感分析
            messages = [
                {
                    "role": "system",
                    "content": "你是一个专业的情感分析专家。分析用户评论，判断情感倾向（正面/负面/中性），并给出置信度和理由。\n\n请以JSON格式返回：\n{\n  \"sentiment\": \"positive|negative|neutral\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"判断理由\"\n}"
                },
                {
                    "role": "user",
                    "content": f"请分析以下评论的情感倾向：\n\n{text}"
                }
            ]
            
            result = await openai_service.get_chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=500
            )
            
            if result.get('success'):
                content = result.get('content', '')
                # 提取JSON
                json_match = re.search(r'\{[\s\S]*?\}', content)
                if json_match:
                    analysis = json.loads(json_match.group())
                    
                    # 翻译情感标签
                    sentiment_cn = {
                        'positive': '正面',
                        'negative': '负面',
                        'neutral': '中性'
                    }
                    
                    return {
                        "success": True,
                        "type": "sentiment_analysis",
                        "data": {
                            "sentiment": analysis.get('sentiment', 'neutral'),
                            "sentiment_cn": sentiment_cn.get(analysis.get('sentiment', 'neutral'), '中性'),
                            "confidence": analysis.get('confidence', 0.5),
                            "reasoning": analysis.get('reasoning', '')
                        },
                        "message": "情感分析完成"
                    }
                else:
                    # 如果没有JSON，直接返回文本内容
                    return {
                        "success": True,
                        "type": "sentiment_analysis",
                        "data": {"analysis": content},
                        "message": "情感分析完成"
                    }
            else:
                return {
                    "success": False,
                    "error": result.get('error', 'LLM调用失败')
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"情感分析错误: {str(e)}"
            }
    
    async def _execute_game_classification(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行游戏分类
        
        Args:
            parameters: {'description': '这是一款第一人称射击游戏...'}
        """
        description = parameters.get('description', '')
        
        if not description:
            return {
                "success": False,
                "error": "缺少必要参数: description"
            }
        
        try:
            # 调用LLM进行游戏分类
            messages = [
                {
                    "role": "system",
                    "content": "你是游戏分类专家。根据游戏描述，提取游戏类型标签。\n\n常见标签：RPG、射击、策略、模拟、冒险、休闲、竞技、卡牌、MOBA、MMO等。\n\n请以JSON格式返回：\n{\n  \"tags\": [\"标签1\", \"标签2\", \"标签3\"],\n  \"primary_genre\": \"主要类型\",\n  \"reasoning\": \"分类理由\"\n}"
                },
                {
                    "role": "user",
                    "content": f"请为以下游戏分类：\n\n{description}"
                }
            ]
            
            result = await openai_service.get_chat_completion(
                messages=messages,
                temperature=0.4,
                max_tokens=300
            )
            
            if result.get('success'):
                content = result.get('content', '')
                # 提取JSON
                json_match = re.search(r'\{[\s\S]*?\}', content)
                if json_match:
                    classification = json.loads(json_match.group())
                    
                    return {
                        "success": True,
                        "type": "game_classification",
                        "data": {
                            "tags": classification.get('tags', []),
                            "primary_genre": classification.get('primary_genre', ''),
                            "reasoning": classification.get('reasoning', '')
                        },
                        "message": "游戏分类完成"
                    }
                else:
                    # 如果没有JSON，直接返回文本内容
                    return {
                        "success": True,
                        "type": "game_classification",
                        "data": {"classification": content},
                        "message": "游戏分类完成"
                    }
            else:
                return {
                    "success": False,
                    "error": result.get('error', 'LLM调用失败')
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"游戏分类错误: {str(e)}"
            }
    
    # ==========================================
    # 图像生成类 Actions
    # ==========================================
    
    async def _execute_image_generation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行图像生成
        
        Args:
            parameters: {'prompt': '图像描述', 'width': 1536, 'height': 1024}
        """
        prompt = parameters.get('prompt', '')
        width = parameters.get('width', 1536)
        height = parameters.get('height', 1024)

        if not prompt:
            return {
                "success": False,
                "error": "缺少必要参数: prompt"
            }

        # 调用图像生成服务
        result = await gpt_image_service.generate_image(
            prompt=prompt,
            width=width,
            height=height
        )

        if result.get('success'):
            return {
                "success": True,
                "type": "image_generation",
                "data": {
                    "image_base64": result.get('image_base64'),
                    "prompt": prompt,
                    "size": f"{width}x{height}",
                    "model": "gpt-image-1"
                },
                "message": "图像生成成功"
            }
        else:
            return {
                "success": False,
                "error": result.get('error', '图像生成失败')
        }

# 创建全局实例
action_executor_service = ActionExecutorService()
