import React from 'react';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Stack sx={{ p: 2 }}>
          <Alert severity="error" variant="outlined" action={<Button onClick={this.handleReload}>刷新</Button>}>
            <AlertTitle>页面发生错误</AlertTitle>
            {this.state.error?.message}
          </Alert>
        </Stack>
      );
    }
    return this.props.children;
  }
}


