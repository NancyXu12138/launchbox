#!/usr/bin/env python3
import re

# 读取文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 检查是否存在重复导入
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'import { FormControl, InputLabel, Select, MenuItem }' in line:
        print(f"Found duplicate import at line {i+1}: {line}")
        # 删除这一行
        lines[i] = ''

# 重新组合内容
content = '\n'.join(lines)

# 清理多余的空行
content = re.sub(r'\n\n\n+', '\n\n', content)

# 写入文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed import duplicates!")
