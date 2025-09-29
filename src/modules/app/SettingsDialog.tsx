import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';
import { getSettings, setSettings, OllamaSettings } from '../../services/settings';

export default function SettingsDialog(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<OllamaSettings>(() => getSettings());

  React.useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-settings-dialog', handler as unknown as EventListener);
    return () => document.removeEventListener('open-settings-dialog', handler as unknown as EventListener);
  }, []);

  function handleSave(): void {
    setSettings(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>设置</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
          <TextField
            label="Ollama Base URL"
            placeholder="/ollama 或 http://127.0.0.1:11434"
            value={form.baseUrl}
            onChange={(e) => setForm(f => ({ ...f, baseUrl: e.target.value }))}
          />
          <TextField
            label="模型"
            placeholder="llama3.1 或 qwen3:8b"
            value={form.model}
            onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
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


