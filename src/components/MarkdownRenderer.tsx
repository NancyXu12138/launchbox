import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// 自定义样式的Markdown容器
const StyledMarkdownBox = styled(Box)(({ theme }) => ({
  '& h1': {
    fontSize: '1.75rem',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    color: theme.palette.primary.main,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    paddingBottom: theme.spacing(1),
    '&:first-of-type': {
      marginTop: 0,
    },
  },
  '& h2': {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(2.5),
    color: theme.palette.text.primary,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing(1),
  },
  '& h3': {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  '& h4, & h5, & h6': {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(1.5),
    color: theme.palette.text.primary,
  },
  '& p': {
    marginBottom: theme.spacing(1.5),
    lineHeight: 1.7,
    color: theme.palette.text.primary,
  },
  '& ul, & ol': {
    marginBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(3),
  },
  '& li': {
    marginBottom: theme.spacing(0.5),
    lineHeight: 1.6,
  },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.grey[300]}`,
    paddingLeft: theme.spacing(2),
    marginLeft: 0,
    marginBottom: theme.spacing(2),
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.grey[50],
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
  },
  '& code': {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.875rem',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  },
  '& pre': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
    marginBottom: theme.spacing(2),
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
      color: 'inherit',
    },
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 1.5),
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 600,
  },
  '& tr:nth-of-type(even)': {
    backgroundColor: theme.palette.grey[50],
  },
  '& strong': {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& em': {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
  '& hr': {
    border: 'none',
    borderTop: `2px solid ${theme.palette.divider}`,
    margin: theme.spacing(3, 0),
  },
}));

interface MarkdownRendererProps {
  content: string;
  sx?: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, sx }) => {
  return (
    <StyledMarkdownBox sx={sx}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义组件渲染
          h1: ({ children }) => (
            <Typography variant="h4" component="h1" gutterBottom>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h5" component="h2" gutterBottom>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="h6" component="h3" gutterBottom>
              {children}
            </Typography>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </StyledMarkdownBox>
  );
};

export default MarkdownRenderer;
