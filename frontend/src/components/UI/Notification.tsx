import React, { useState, useEffect } from 'react';
import { Alert, Box, Slide } from '@mui/material';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setOpen(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  if (!open) return null;

  return (
    <Slide direction="down" in={open} mountOnEnter unmountOnExit>
      <Box sx={{ 
        position: 'fixed', 
        top: 20, 
        left: 0, 
        right: 0, 
        zIndex: 9999, 
        display: 'flex', 
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <Alert
          severity={type}
          onClose={handleClose}
          sx={{
            maxWidth: 400,
            boxShadow: 3,
            borderRadius: 2,
            pointerEvents: 'auto'
          }}
        >
          {message}
        </Alert>
      </Box>
    </Slide>
  );
};

export default Notification;