#!/usr/bin/env python3
import re

# 读取文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复技能选择的onClick逻辑
old_onclick = """                onClick={() => {
                  setSelectedSkill(skill.id);
                  setSkillDialogOpen(false);
                }}"""

new_onclick = """                onClick={() => {
                  if (skill.id === 'event_planning') {
                    setEventPlannerDialogOpen(true);
                    setSkillDialogOpen(false);
                  } else {
                    setSelectedSkill(skill.id);
                    setSkillDialogOpen(false);
                  }
                }}"""

content = content.replace(old_onclick, new_onclick)

# 写入文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed skill selection logic!")
