import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const TestCalendar: React.FC = () => {
  const testEvents = [
    {
      id: '1',
      title: 'Test Event',
      start: '2024-01-15',
      allDay: true
    },
    {
      id: '2',
      title: 'Another Event',
      start: '2024-01-20',
      allDay: true
    }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Test Calendar Component
        </Typography>
        <Box sx={{ height: 400 }}>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={testEvents}
            height="100%"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TestCalendar;
