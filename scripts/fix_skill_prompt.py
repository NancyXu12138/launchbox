#!/usr/bin/env python3

# 读取文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复placeholder逻辑
old_placeholder = 'placeholder={selectedSkill === \'image_generation\' ? "描述您想要生成的图像..." : "输入消息..."}'
new_placeholder = '''placeholder={
                  selectedSkill === 'image_generation' ? "描述您想要生成的图像..." :
                  selectedSkill === 'event_planning' ? "Event Planner输入消息..." :
                  "输入消息..."
                }'''

content = content.replace(old_placeholder, new_placeholder)

# 修复技能提示显示逻辑
# 查找技能提示的显示逻辑
old_skill_display = """                      <Typography variant="body2" sx={{ 
                        color: 'primary.main', 
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        mr: 0.5,
                        pointerEvents: 'auto',
                        cursor: 'default'
                      }}>
                        {skills.find(s => s.id === selectedSkill)?.name}
                      </Typography>"""

new_skill_display = """                      <Typography variant="body2" sx={{ 
                        color: 'primary.main', 
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        mr: 0.5,
                        pointerEvents: 'auto',
                        cursor: 'default',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '80px'
                      }}>
                        {skills.find(s => s.id === selectedSkill)?.name}
                      </Typography>"""

content = content.replace(old_skill_display, new_skill_display)

# 写入文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed skill prompt display!")
