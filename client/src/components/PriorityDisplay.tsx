import React from 'react';
import { Box, useTheme } from '@mui/material';
import { getPriorityDisplayVariant, formatPriorityForContext } from '../utils/priorityUtils';
import type { PriorityLevel } from '../utils/priorityUtils';

interface PriorityDisplayProps {
  priority: PriorityLevel | undefined;
  variant?: 'dot' | 'chip' | 'text' | 'icon' | 'badge';
  context?: 'dashboard' | 'list' | 'card' | 'graph' | 'calendar';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const PriorityDisplay: React.FC<PriorityDisplayProps> = ({
  priority,
  variant,
  context = 'card',
  size = 'medium',
  className
}) => {
  const theme = useTheme();
  
  // Skip rendering if no priority and NONE priorities shouldn't be shown
  if (!priority || priority === 'NONE') {
    // Only show NONE priority in specific contexts
    if (context !== 'dashboard' && variant !== 'chip') {
      return null;
    }
  }
  
  // Determine display configuration based on context
  const contextConfig = formatPriorityForContext(priority, context);
  const finalVariant = variant || contextConfig.variant;
  const finalSize = size || contextConfig.size || 'medium';
  
  // Get the display configuration
  const displayConfig = getPriorityDisplayVariant(priority, theme, finalVariant);
  
  // Size adjustments
  const sizeAdjustments = {
    small: {
      scale: 0.85,
      fontSize: '0.65rem',
      padding: '1px 4px',
      iconSize: '0.85rem'
    },
    medium: {
      scale: 1,
      fontSize: '0.75rem', 
      padding: '2px 6px',
      iconSize: '1rem'
    },
    large: {
      scale: 1.15,
      fontSize: '0.85rem',
      padding: '3px 8px',
      iconSize: '1.15rem'
    }
  };
  
  const sizeConfig = sizeAdjustments[finalSize];
  
  // Apply size adjustments to the display config
  const adjustedSx = {
    ...displayConfig.sx,
    transform: finalVariant === 'dot' ? `scale(${sizeConfig.scale})` : undefined,
    fontSize: finalVariant !== 'dot' ? sizeConfig.fontSize : displayConfig.sx?.fontSize,
    padding: finalVariant === 'chip' || finalVariant === 'badge' ? sizeConfig.padding : displayConfig.sx?.padding,
  };
  
  return (
    <Box
      component={displayConfig.component}
      className={className}
      sx={adjustedSx}
      title={`Priority: ${priority?.toLowerCase() || 'none'}`}
    >
      {displayConfig.children}
    </Box>
  );
};

export default PriorityDisplay;