import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          mx: 'auto',
          textAlign: 'center',
        }}
      >
        <SentimentVeryDissatisfiedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Страница не найдена
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Извините, но запрошенная страница не существует или была перемещена.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Вернуться на главную
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound; 