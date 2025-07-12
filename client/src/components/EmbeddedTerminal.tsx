import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  Clear as ClearIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: 'running' | 'completed' | 'error';
}

interface TerminalSession {
  id: string;
  active: boolean;
}

const EmbeddedTerminal: React.FC = () => {
  const theme = useTheme();
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [isFullTerminal, setIsFullTerminal] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('~');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new commands are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    // Create terminal session on mount
    createSession();
    
    // Cleanup session on unmount
    return () => {
      if (session?.id) {
        fetch(`/api/terminal/session/${session.id}`, {
          method: 'DELETE'
        });
      }
    };
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch('/api/terminal/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        setSession({ id: sessionData.sessionId, active: true });
        setIsFullTerminal(true);
        
        // Add welcome message
        setCommands([{
          id: Date.now().toString(),
          command: '',
          output: 'Full terminal session started. You now have access to bash shell.\nType "help" for available commands or any bash command.',
          timestamp: new Date(),
          status: 'completed'
        }]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to create terminal session:', error);
      }
      setIsFullTerminal(false);
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    const commandId = Date.now().toString();
    const newCommand: TerminalCommand = {
      id: commandId,
      command: cmd,
      output: '',
      timestamp: new Date(),
      status: 'running'
    };

    setCommands(prev => [...prev, newCommand]);
    setCommandHistory(prev => [...prev, cmd]);
    setCurrentCommand('');
    setHistoryIndex(-1);

    try {
      // Use session if available, otherwise fallback to regular execution
      const payload: any = { command: cmd };
      if (session?.id && isFullTerminal) {
        payload.sessionId = session.id;
      }

      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      // Update current directory if cd command was used
      if (cmd.trim().startsWith('cd ')) {
        try {
          const pwdResponse = await fetch('/api/terminal/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              command: 'pwd',
              sessionId: session?.id 
            })
          });
          const pwdResult = await pwdResponse.json();
          if (pwdResult.output) {
            setCurrentDirectory(pwdResult.output.trim().split('/').pop() || '~');
          }
        } catch (e) {
          // Ignore pwd errors
        }
      }
      
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { 
              ...c, 
              output: result.output || result.error || 'Command completed', 
              status: response.ok && !result.error ? 'completed' : 'error' 
            }
          : c
      ));
    } catch (error) {
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { 
              ...c, 
              output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              status: 'error' 
            }
          : c
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const clearTerminal = () => {
    setCommands([]);
    if (isFullTerminal && commands.length > 0) {
      // Add a clear message for full terminal
      setCommands([{
        id: Date.now().toString(),
        command: 'clear',
        output: 'Terminal cleared.',
        timestamp: new Date(),
        status: 'completed'
      }]);
    }
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const getStatusColor = (status: TerminalCommand['status']) => {
    switch (status) {
      case 'running': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Paper
      className="glass-task-container"
      sx={{
        background: theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.8)' 
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out',
        height: isMinimized ? 60 : 400
      }}
    >
      {/* Terminal Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: alpha(theme.palette.primary.main, 0.05)
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {isFullTerminal ? 'Full Terminal' : 'Terminal'}
          </Typography>
          {isFullTerminal && (
            <Chip 
              label="PTY" 
              size="small" 
              color="success" 
              variant="outlined"
              sx={{ height: 20, fontSize: '0.6rem' }}
            />
          )}
          <Chip 
            label={commands.length} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); clearTerminal(); }}>
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
          {isFullTerminal && (
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); createSession(); }}
              title="Restart Terminal Session"
            >
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <IconButton size="small">
            {isMinimized ? <DownIcon sx={{ fontSize: 16 }} /> : <UpIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      </Box>

      {!isMinimized && (
        <>
          {/* Terminal Output */}
          <Box
            ref={terminalRef}
            sx={{
              height: 300,
              overflow: 'auto',
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'rgba(0, 0, 0, 0.02)',
              '&::-webkit-scrollbar': {
                width: 6
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 3
              }
            }}
          >
            {commands.length === 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary', 
                  fontStyle: 'italic',
                  fontFamily: 'monospace'
                }}
              >
                {isFullTerminal ? (
                  <>
                    Full Terminal Experience - Bash shell with persistent session
                    <br />
                    Try: ls, cd, pwd, git status, npm commands, vim, nano, etc.
                    <br />
                    Use ↑/↓ arrows for command history | 'clear' to clear terminal
                    <br />
                    Session persists until page reload or manual termination
                  </>
                ) : (
                  <>
                    Welcome to Synaptik Terminal. Type a command and press Enter.
                    <br />
                    Try: ls, pwd, git status, npm --version, bash, echo "hello world"
                    <br />
                    Use ↑/↓ arrows for command history | 'clear' to clear terminal
                    <br />
                    Note: Use minimize button instead of 'q' or 'exit'
                  </>
                )}
              </Typography>
            )}
            
            {commands.map((cmd) => (
              <Box key={cmd.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography 
                    component="span" 
                    sx={{ 
                      color: 'primary.main', 
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}
                  >
                    $
                  </Typography>
                  <Typography 
                    component="span" 
                    sx={{ 
                      color: 'text.primary',
                      fontFamily: 'monospace',
                      flexGrow: 1
                    }}
                  >
                    {cmd.command}
                  </Typography>
                  <Chip
                    size="small"
                    label={cmd.status}
                    sx={{
                      height: 16,
                      fontSize: '0.6rem',
                      color: getStatusColor(cmd.status),
                      borderColor: getStatusColor(cmd.status)
                    }}
                    variant="outlined"
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => copyCommand(cmd.command)}
                    sx={{ p: 0.5 }}
                  >
                    <CopyIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
                
                {cmd.output && (
                  <Typography 
                    component="pre" 
                    sx={{ 
                      color: cmd.status === 'error' ? 'error.main' : 'text.secondary',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      ml: 2,
                      mt: 0.5
                    }}
                  >
                    {cmd.output}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* Terminal Input */}
          <Box
            sx={{
              p: 1.5,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: alpha(theme.palette.background.paper, 0.5)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                {isFullTerminal ? `synaptik:${currentDirectory}$` : '$'}
              </Typography>
              <TextField
                ref={inputRef}
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
                variant="standard"
                fullWidth
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: 'text.primary'
                  }
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    p: 0
                  }
                }}
              />
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default EmbeddedTerminal;
