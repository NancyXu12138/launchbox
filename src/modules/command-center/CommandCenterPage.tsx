import React from 'react';
import { Paper, Stack, TextField, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Tabs, Tab, Switch } from '@mui/material';
import { CommandItem, getCommands, saveCommands } from '../../services/commandService';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

export default function CommandCenterPage(): JSX.Element {
  const [commands, setCommands] = React.useState<CommandItem[]>([]);

  // 加载指令数据
  React.useEffect(() => {
    setCommands(getCommands());
  }, []);
  const [activeTab, setActiveTab] = React.useState<'personal' | 'public'>('personal');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedCommand, setSelectedCommand] = React.useState<CommandItem | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    todoList: '',
    enabled: true
  });

  // 根据当前Tab过滤指令
  const filteredCommands = commands.filter(cmd => cmd.category === activeTab);

  const handleCreateCommand = () => {
    setFormData({ name: '', description: '', todoList: '', enabled: true });
    setCreateDialogOpen(true);
  };

  const handleViewCommand = (command: CommandItem) => {
    setSelectedCommand(command);
    setViewDialogOpen(true);
  };

  const handleEditCommand = (command: CommandItem) => {
    setSelectedCommand(command);
    setFormData({
      name: command.name,
      description: command.description,
      todoList: command.todoList,
      enabled: command.enabled
    });
    setEditDialogOpen(true);
  };

  // 切换指令启用状态
  const handleToggleEnabled = (commandId: string) => {
    const updatedCommands = commands.map(cmd => 
      cmd.id === commandId ? { ...cmd, enabled: !cmd.enabled } : cmd
    );
    setCommands(updatedCommands);
    saveCommands(updatedCommands);
  };

  const handleSaveCommand = () => {
    let updatedCommands: CommandItem[];
    
    if (selectedCommand) {
      // 编辑现有指令
      updatedCommands = commands.map(c => 
        c.id === selectedCommand.id 
          ? { ...c, ...formData }
          : c
      );
      setEditDialogOpen(false);
    } else {
      // 创建新指令
      const newCommand: CommandItem = {
        id: Date.now().toString(),
        ...formData,
        category: activeTab // 根据当前Tab设置分类
      };
      updatedCommands = [newCommand, ...commands];
      setCreateDialogOpen(false);
    }
    
    setCommands(updatedCommands);
    saveCommands(updatedCommands); // 保存到localStorage
    setSelectedCommand(null);
  };


  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack>
          <Typography variant="h5">指挥中心</Typography>
          <Typography variant="body2" color="text.secondary">
            创建和管理指令模板，通过todolist指导LLM制定详细的执行计划
          </Typography>
        </Stack>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateCommand}
        >
          新建指令
        </Button>
      </Stack>

      {/* Tab切换 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="指令分类"
        >
          <Tab label="我的指令" value="personal" />
          <Tab label="公开指令" value="public" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, elevation: 0, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2 }}>指令名称</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2 }}>描述</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2, width: 120 }}>启用状态</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCommands.map(command => (
              <TableRow key={command.id} sx={{ '&:hover': { backgroundColor: 'grey.25' }, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TableCell sx={{ py: 2.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {command.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {command.description}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                  <Switch
                    checked={command.enabled}
                    onChange={() => handleToggleEnabled(command.id)}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      sx={{ 
                        minWidth: 80,
                        px: 1,
                        color: 'grey.600',
                        borderColor: 'grey.300',
                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                      }}
                      onClick={() => handleViewCommand(command)}
                    >
                      查看
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filteredCommands.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">暂无指令，点击"新建指令"开始创建</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 查看指令对话框 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          {selectedCommand?.name}
          <IconButton 
            onClick={() => setViewDialogOpen(false)}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">描述</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedCommand?.description}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">任务步骤</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {selectedCommand?.todoList}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start' }}>
          <Button 
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setViewDialogOpen(false);
              handleEditCommand(selectedCommand!);
            }}
          >
            编辑指令
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建指令对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新建指令</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="指令名称" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth 
            />
            <TextField 
              label="描述" 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth 
              placeholder="输入什么，输出什么的简单概述..."
            />
            <TextField 
              label="任务步骤 (TodoList)" 
              value={formData.todoList}
              onChange={(e) => setFormData(prev => ({ ...prev, todoList: e.target.value }))}
              fullWidth 
              multiline 
              rows={10}
              placeholder="请按照以下格式输入任务步骤：&#10;1. 第一步要做的事情&#10;2. 第二步要做的事情&#10;3. 第三步要做的事情&#10;..."
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                提示：每行一个步骤，LLM会根据这些步骤制定详细的执行计划
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCommand}
            disabled={!formData.name.trim() || !formData.todoList.trim()}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑指令对话框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>编辑指令</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="指令名称" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth 
            />
            <TextField 
              label="描述" 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth 
              placeholder="输入什么，输出什么的简单概述..."
            />
            <TextField 
              label="任务步骤 (TodoList)" 
              value={formData.todoList}
              onChange={(e) => setFormData(prev => ({ ...prev, todoList: e.target.value }))}
              fullWidth 
              multiline 
              rows={10}
              placeholder="请按照以下格式输入任务步骤：&#10;1. 第一步要做的事情&#10;2. 第二步要做的事情&#10;3. 第三步要做的事情&#10;..."
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                提示：每行一个步骤，LLM会根据这些步骤制定详细的执行计划
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCommand}
            disabled={!formData.name.trim() || !formData.todoList.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

    </Stack>
  );
}
