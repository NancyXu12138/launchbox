#!/usr/bin/env python3
import re

# 读取文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 添加Event Planner Dialog
dialog_content = """
          {/* Event Planner 表单弹窗 */}
          <Dialog
            open={eventPlannerDialogOpen}
            onClose={() => setEventPlannerDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Event Planner - 活动策划</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* 活动主题 */}
                <TextField
                  fullWidth
                  required
                  label="活动主题"
                  placeholder="例如：春节庆典、电竞联赛、周年庆典"
                  value={eventPlannerForm.theme}
                  onChange={(e) => setEventPlannerForm(prev => ({ ...prev, theme: e.target.value }))}
                />
                
                {/* 活动概要 */}
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="活动概要"
                  placeholder="简要描述活动的核心内容和玩法..."
                  value={eventPlannerForm.overview}
                  onChange={(e) => setEventPlannerForm(prev => ({ ...prev, overview: e.target.value }))}
                />
                
                {/* 活动市场 */}
                <TextField
                  fullWidth
                  required
                  label="活动市场"
                  placeholder="例如：中国大陆、东南亚、全球"
                  value={eventPlannerForm.market}
                  onChange={(e) => setEventPlannerForm(prev => ({ ...prev, market: e.target.value }))}
                />
                
                {/* 业务目标 */}
                <FormControl fullWidth required>
                  <InputLabel>业务目标</InputLabel>
                  <Select
                    value={eventPlannerForm.businessGoal}
                    onChange={(e) => setEventPlannerForm(prev => ({ ...prev, businessGoal: e.target.value }))}
                    label="业务目标"
                  >
                    {businessGoalOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* 自定义业务目标 */}
                {eventPlannerForm.businessGoal === 'custom' && (
                  <TextField
                    fullWidth
                    label="自定义业务目标"
                    placeholder="请描述具体的业务目标和指标..."
                    value={eventPlannerForm.businessGoalCustom}
                    onChange={(e) => setEventPlannerForm(prev => ({ ...prev, businessGoalCustom: e.target.value }))}
                  />
                )}
                
                {/* 目标玩家 */}
                <FormControl fullWidth required>
                  <InputLabel>目标玩家</InputLabel>
                  <Select
                    value={eventPlannerForm.targetPlayer}
                    onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetPlayer: e.target.value }))}
                    label="目标玩家"
                  >
                    {targetPlayerOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* 自定义目标玩家 */}
                {eventPlannerForm.targetPlayer === 'custom' && (
                  <TextField
                    fullWidth
                    label="自定义目标玩家"
                    placeholder="请描述目标玩家群体的特征..."
                    value={eventPlannerForm.targetPlayerCustom}
                    onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetPlayerCustom: e.target.value }))}
                  />
                )}
                
                {/* 目标区域 */}
                <TextField
                  fullWidth
                  required
                  label="目标区域"
                  placeholder="例如：亚太地区、欧美市场、全球"
                  value={eventPlannerForm.targetRegion}
                  onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetRegion: e.target.value }))}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEventPlannerDialogOpen(false)}>取消</Button>
              <Button 
                variant="contained" 
                onClick={handleEventPlannerSubmit}
                disabled={!eventPlannerForm.theme || !eventPlannerForm.overview || !eventPlannerForm.market || !eventPlannerForm.businessGoal || !eventPlannerForm.targetPlayer || !eventPlannerForm.targetRegion}
              >
                开始生成策划案
              </Button>
            </DialogActions>
          </Dialog>
"""

# 在图片放大弹窗前添加Event Planner Dialog
content = content.replace(
    "          {/* 图片放大弹窗 */}",
    f"{dialog_content}\n          {{/* 图片放大弹窗 */}}"
)

# 写入文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Event Planner Dialog added successfully!")
