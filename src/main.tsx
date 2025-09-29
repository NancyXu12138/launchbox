import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline as MuiCssBaseline } from '@mui/material';
import App from './modules/app/App';
import ErrorBoundary from './modules/app/ErrorBoundary';
import ChatPage from './modules/chat/ChatPage';
import AcceptancePage from './modules/acceptance/AcceptancePage';
import CommandCenterPage from './modules/command-center/CommandCenterPage';
import KnowledgeBasePage from './modules/knowledge-base/KnowledgeBasePage';
import ActionsPage from './modules/actions/ActionsPage';

const theme = createTheme({
  palette: { 
    mode: 'light', 
    primary: { main: '#1976d2' }, 
    background: { default: '#fafafa' }
  },
  shape: { borderRadius: 8 }
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <ChatPage /> },
      { path: 'acceptance', element: <AcceptancePage /> },
      { path: 'command-center', element: <CommandCenterPage /> },
      { path: 'knowledge-base', element: <KnowledgeBasePage /> },
      { path: 'actions', element: <ActionsPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <MuiCssBaseline />
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);


