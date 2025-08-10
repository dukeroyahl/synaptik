import React from 'react';
import { Chip, useTheme } from '@mui/material';

interface UrgencyChipProps {
  urgency?: number; // numeric urgency score
  size?: 'small' | 'medium';
  showLabel?: boolean; // whether to show textual label (e.g., HIGH) instead of numeric
}

// Map numeric urgency score to level key
function getUrgencyLevel(score?: number) {
  if (!score || score <= 0) return 'NONE';
  if (score >= 15) return 'CRITICAL';
  if (score >= 10) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  if (score >= 3) return 'LOW';
  return 'NONE';
}

const UrgencyChip: React.FC<UrgencyChipProps> = ({ urgency, size = 'small', showLabel = false }) => {
  const theme: any = useTheme();
  const level = getUrgencyLevel(urgency);
  const style = theme.semanticStyles?.urgency[level];
  if (!urgency || urgency <= 0 || !style) return null;
  const label = showLabel ? level : urgency!.toFixed(1);
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        fontSize: '0.65rem',
        height: size === 'small' ? 20 : 24,
        background: style.gradient,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontWeight: 600
      }}
    />
  );
};

export default UrgencyChip;
