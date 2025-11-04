#!/usr/bin/env python3
import re

# 读取文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复重复导入的问题
# 移除重复的import行
content = content.replace(
    "import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';",
    ""
)

# 写入文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Import duplicates fixed!")
