/**
 * 设置对话框组件
 * 
 * 功能：
 * - 配置后端API地址
 * - 启用/禁用后端API
 */

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, FormControlLabel, Switch } from '@mui/material';
import { getAppSettings, setAppSettings, AppSettings } from '../../services/settings';

export default function SettingsDialog(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<AppSettings>(() => getAppSettings());

  React.useEffect(() => {
    const handler = () => {
      // 每次打开时重新加载设置
      setForm(getAppSettings());
      setOpen(true);
    };
    document.addEventListener('open-settings-dialog', handler as unknown as EventListener);
    return () => document.removeEventListener('open-settings-dialog', handler as unknown as EventListener);
  }, []);

  function handleSave(): void {
    setAppSettings(form);
    setOpen(false);
    console.log('✅ 设置已保存:', form);
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>系统设置</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.useBackendApi}
                onChange={(e) => setForm(f => ({ ...f, useBackendApi: e.target.checked }))}
              />
            }
            label="使用后端API"
          />
          
          <TextField
            label="后端API地址"
            placeholder="http://localhost:8001"
            value={form.backendUrl}
            onChange={(e) => setForm(f => ({ ...f, backendUrl: e.target.value }))}
            disabled={!form.useBackendApi}
            helperText="后端服务器的地址，默认为 http://localhost:8001"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>取消</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}
