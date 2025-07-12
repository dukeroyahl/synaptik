import React from 'react';
import { Box, Typography } from '@mui/material';

const CalendarView: React.FC = () => {
  console.log('CalendarView: Simple version rendering');
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Task Calendar - Test Version
      </Typography>
      
      <Box sx={{ 
        height: 400, 
        backgroundColor: 'red', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '3rem',
        border: '5px solid black'
      }}>
        CALENDAR TEST - VISIBLE NOW?
      </Box>
    </Box>
  );
};

export default CalendarView;
