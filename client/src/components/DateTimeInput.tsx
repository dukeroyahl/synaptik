import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { 
  isoToDateInput, 
  dateInputToISO,
  isoToDateTimeInput,
  dateTimeInputToISO,
  getUserTimezone,
  formatDateWithTimezone
} from '../utils/dateUtils';

interface DateTimeInputProps {
  label: string;
  value: string; // ISO 8601 string from backend
  onChange: (isoString: string) => void;
  type?: 'date' | 'datetime' | 'datetime-local';
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  showTimezone?: boolean;
  timezone?: string;
}

/**
 * Enhanced date/datetime input component with full ISO 8601 timezone support
 * Handles conversion between backend ISO format and UI display formats
 */
const DateTimeInput: React.FC<DateTimeInputProps> = ({
  label,
  value,
  onChange,
  type = 'date',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  showTimezone = false,
  timezone
}) => {
  const userTimezone = timezone || getUserTimezone();

  // Handle native HTML input change
  const handleNativeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (!inputValue) {
      onChange('');
      return;
    }

    try {
      let isoString: string;
      if (type === 'date') {
        isoString = dateInputToISO(inputValue, userTimezone);
      } else {
        isoString = dateTimeInputToISO(inputValue, userTimezone);
      }
      onChange(isoString);
    } catch (error) {
      console.error('Error converting input to ISO:', error);
      onChange('');
    }
  };

  // Render native HTML input
  const renderNativeInput = () => {
    const inputType = type === 'datetime' ? 'datetime-local' : 'date';
    const inputValue = type === 'datetime' 
      ? isoToDateTimeInput(value, userTimezone)
      : isoToDateInput(value);

    return (
      <TextField
        label={label}
        type={inputType}
        value={inputValue}
        onChange={handleNativeChange}
        required={required}
        disabled={disabled}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        InputLabelProps={{
          shrink: true,
        }}
      />
    );
  };

  return (
    <Box>
      {renderNativeInput()}
      
      {/* Show timezone info if requested */}
      {showTimezone && value && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Timezone: {userTimezone}
          {value && (
            <>
              <br />
              Full format: {formatDateWithTimezone(value, userTimezone)}
            </>
          )}
        </Typography>
      )}
    </Box>
  );
};

export default DateTimeInput;
