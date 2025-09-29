import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Container, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SettingsDialog from './SettingsDialog';

export default function App(): JSX.Element {
  const location = useLocation();
  const drawerWidth = 232;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>LaunchBox</Typography>
          <SettingsDialog />
          <IconButton aria-label="settings" onClick={() => document.dispatchEvent(new CustomEvent('open-settings-dialog'))}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton 
              component={Link} 
              to="/" 
              selected={location.pathname === '/'}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon><ChatIcon /></ListItemIcon>
              <ListItemText primary="聊天" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/acceptance" 
              selected={location.pathname.startsWith('/acceptance')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon><AssignmentTurnedInIcon /></ListItemIcon>
              <ListItemText primary="验收台" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/command-center" 
              selected={location.pathname.startsWith('/command-center')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="指挥中心" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/knowledge-base" 
              selected={location.pathname.startsWith('/knowledge-base')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon><LibraryBooksIcon /></ListItemIcon>
              <ListItemText primary="知识" />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/actions" 
              selected={location.pathname.startsWith('/actions')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon><ListAltIcon /></ListItemIcon>
              <ListItemText primary="动作库" />
            </ListItemButton>
          </List>
          <Divider />
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        {location.pathname === '/' ? (
          // 聊天页面使用全宽布局
          <Box sx={{ py: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Outlet />
          </Box>
        ) : (
          // 其他页面使用Container布局
          <Container maxWidth="lg" sx={{ py: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Outlet />
          </Container>
        )}
      </Box>
    </Box>
  );
}


