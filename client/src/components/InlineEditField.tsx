import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  TextField,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

interface InlineEditFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  variant?: 'text' | 'date';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  typography?: 'h4' | 'body1' | 'body2' | 'caption';
  disabled?: boolean;
  className?: string;
  sx?: any;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  onSave,
  variant = 'text',
  placeholder = 'Click to edit',
  multiline = false,
  rows = 1,
  typography = 'body1',
  disabled = false,
  className,
  sx = {}
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Only call select() if it exists (not available for all input types like date)
      if (inputRef.current.select && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue !== value && editValue.trim() !== '') {
      setIsSaving(true);
      try {
        await onSave(editValue.trim());
      } catch (error) {
        // Revert on error
        setEditValue(value);
        console.error('Failed to save:', error);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to prevent race conditions with onClick
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 100);
  };

  // Format display value based on variant
  const getDisplayValue = () => {
    if (!value) return placeholder;
    
    if (variant === 'date' && value) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    }
    
    return value;
  };

  // Get input type based on variant
  const getInputType = () => {
    switch (variant) {
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  // Get input value for editing (dates need special handling)
  const getInputValue = () => {
    if (variant === 'date' && editValue) {
      try {
        const date = new Date(editValue);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } catch {
        return editValue;
      }
    }
    return editValue;
  };

  if (isEditing) {
    // Get typography styles from theme
    const getTypographyStyles = (variant: string) => {
      const typographyVariants = theme.typography as any;
      return typographyVariants[variant] || {};
    };

    const typographyStyles = getTypographyStyles(typography);

    return (
      <TextField
        ref={inputRef}
        value={getInputValue()}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        type={getInputType()}
        multiline={multiline}
        rows={multiline ? rows : 1}
        variant="outlined"
        size="small"
        disabled={isSaving}
        className={className}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            fontSize: typographyStyles.fontSize || 'inherit',
            fontWeight: typographyStyles.fontWeight || 'inherit',
            fontFamily: typographyStyles.fontFamily || 'inherit',
            lineHeight: typographyStyles.lineHeight || 'inherit',
            letterSpacing: typographyStyles.letterSpacing || 'inherit',
            padding: '4px 8px', // Minimal padding to match typography spacing
          },
          '& .MuiOutlinedInput-input': {
            padding: '0', // Remove default input padding
            fontSize: typographyStyles.fontSize || 'inherit',
            fontWeight: typographyStyles.fontWeight || 'inherit',
            fontFamily: typographyStyles.fontFamily || 'inherit',
            lineHeight: typographyStyles.lineHeight || 'inherit',
            letterSpacing: typographyStyles.letterSpacing || 'inherit',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
            borderWidth: '1px',
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px',
          },
          ...sx
        }}
      />
    );
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleStartEdit}
      className={className}
      sx={{
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        padding: '4px 8px', // Match TextField padding
        borderRadius: 1,
        minWidth: '60px',
        minHeight: '40px', // Ensure consistent height
        transition: 'all 0.2s ease-in-out',
        backgroundColor: isHovered && !disabled 
          ? alpha(theme.palette.primary.main, 0.04)
          : 'transparent',
        border: `1px solid ${isHovered && !disabled 
          ? alpha(theme.palette.primary.main, 0.2)
          : 'transparent'}`,
        ...sx
      }}
    >
      <Typography
        variant={typography}
        sx={{
          color: value ? 'inherit' : 'text.disabled',
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {getDisplayValue()}
      </Typography>
      
      {isHovered && !disabled && (
        <EditIcon 
          sx={{ 
            fontSize: 14, 
            color: 'text.secondary',
            opacity: 0.7,
            transition: 'opacity 0.2s ease-in-out'
          }} 
        />
      )}
    </Box>
  );
};

export default InlineEditField;