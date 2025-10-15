import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Container, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Avatar } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SettingsDialog from './SettingsDialog';

export default function App(): JSX.Element {
  const location = useLocation();
  const drawerWidth = 250;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: '#F5F7FA' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: theme => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: '#4A90E2', 
                width: 36, 
                height: 36,
                boxShadow: '0 2px 8px rgba(74,144,226,0.3)'
              }}
            >
              <RocketLaunchIcon />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}
              >
                LaunchBox
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#7F8C8D',
                  fontSize: '0.7rem',
                  display: 'block',
                  lineHeight: 1
                }}
              >
                AI游戏活动策划助手
              </Typography>
            </Box>
          </Box>
          <SettingsDialog />
          <IconButton 
            aria-label="settings" 
            onClick={() => document.dispatchEvent(new CustomEvent('open-settings-dialog'))}
            sx={{
              color: '#4A90E2',
              '&:hover': {
                bgcolor: 'rgba(74,144,226,0.08)'
              }
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer 
        variant="permanent" 
        sx={{ 
          width: drawerWidth, 
          flexShrink: 0, 
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            bgcolor: 'white',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '2px 0 8px rgba(0,0,0,0.03)'
          } 
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            <ListItemButton 
              component={Link} 
              to="/" 
              selected={location.pathname === '/'}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(74,144,226,0.12)',
                  color: '#4A90E2',
                  '&:hover': {
                    bgcolor: 'rgba(74,144,226,0.18)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#4A90E2'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(74,144,226,0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText 
                primary="聊天" 
                primaryTypographyProps={{
                  fontWeight: location.pathname === '/' ? 600 : 400
                }}
              />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/acceptance" 
              selected={location.pathname.startsWith('/acceptance')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(80,200,120,0.12)',
                  color: '#50C878',
                  '&:hover': {
                    bgcolor: 'rgba(80,200,120,0.18)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#50C878'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(80,200,120,0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AssignmentTurnedInIcon />
              </ListItemIcon>
              <ListItemText 
                primary="验收台" 
                primaryTypographyProps={{
                  fontWeight: location.pathname.startsWith('/acceptance') ? 600 : 400
                }}
              />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/command-center" 
              selected={location.pathname.startsWith('/command-center')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(155,89,182,0.12)',
                  color: '#9B59B6',
                  '&:hover': {
                    bgcolor: 'rgba(155,89,182,0.18)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#9B59B6'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(155,89,182,0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText 
                primary="指挥中心" 
                primaryTypographyProps={{
                  fontWeight: location.pathname.startsWith('/command-center') ? 600 : 400
                }}
              />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/knowledge-base" 
              selected={location.pathname.startsWith('/knowledge-base')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(26,188,156,0.12)',
                  color: '#1ABC9C',
                  '&:hover': {
                    bgcolor: 'rgba(26,188,156,0.18)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#1ABC9C'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(26,188,156,0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LibraryBooksIcon />
              </ListItemIcon>
              <ListItemText 
                primary="知识" 
                primaryTypographyProps={{
                  fontWeight: location.pathname.startsWith('/knowledge-base') ? 600 : 400
                }}
              />
            </ListItemButton>
            <ListItemButton 
              component={Link} 
              to="/actions" 
              selected={location.pathname.startsWith('/actions')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(230,126,34,0.12)',
                  color: '#E67E22',
                  '&:hover': {
                    bgcolor: 'rgba(230,126,34,0.18)'
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#E67E22'
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(230,126,34,0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText 
                primary="动作库" 
                primaryTypographyProps={{
                  fontWeight: location.pathname.startsWith('/actions') ? 600 : 400
                }}
              />
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


