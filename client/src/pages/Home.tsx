import { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Box, 
  Paper, 
  Grid, 
  Container,
  Card,
  CardContent,
  CardMedia,
  CardActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import DirectionsIcon from '@mui/icons-material/Directions';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const features = [
  {
    icon: <DirectionsIcon fontSize="large" color="primary" />,
    title: 'Интерактивная карта',
    description: 'Добавляйте точки интереса и планируйте маршруты совместно с друзьями и семьей'
  },
  {
    icon: <AccountBalanceWalletIcon fontSize="large" color="primary" />,
    title: 'Расчет бюджета',
    description: 'Автоматический расчет бюджета с учетом транспорта, жилья и питания'
  },
  {
    icon: <CalendarMonthIcon fontSize="large" color="primary" />,
    title: 'Интеграция с календарями',
    description: 'Удобное согласование дат поездки со всеми участниками'
  },
  {
    icon: <PeopleIcon fontSize="large" color="primary" />,
    title: 'Голосование за маршрут',
    description: 'Выбирайте лучший вариант маршрута совместно со всей группой'
  }
];

const Home = () => {
  return (
    <Box>
      {/* Hero секция */}
      <Paper 
        sx={{ 
          position: 'relative',
          color: 'white',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `url(https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1600)`,
          height: '400px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.4)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            component="h1"
            variant="h2"
            color="inherit"
            gutterBottom
          >
            Планируйте путешествия вместе
          </Typography>
          <Typography variant="h5" color="inherit" paragraph>
            Сервис для друзей и семей, которые хотят организовать идеальную поездку вместе
          </Typography>
          <Button 
            component={Link} 
            to="/create-trip" 
            variant="contained" 
            size="large" 
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: 2 }}
          >
            Создать путешествие
          </Button>
        </Container>
      </Paper>

      {/* Секция возможностей */}
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Возможности платформы
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Наш сервис предлагает все необходимые инструменты для коллективного планирования путешествий
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center'
                }}
              >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  {feature.icon}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Секция призыва к действию */}
        <Paper sx={{ mt: 6, mb: 6, p: 4, bgcolor: 'primary.light', color: 'white' }}>
          <Typography variant="h5" gutterBottom>
            Готовы начать планировать свое следующее путешествие?
          </Typography>
          <Typography paragraph>
            Зарегистрируйтесь бесплатно и начните создавать совместные планы путешествий прямо сейчас.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button 
              component={Link} 
              to="/register" 
              variant="contained" 
              sx={{ mr: 2, bgcolor: 'white', color: 'primary.main' }}
            >
              Зарегистрироваться
            </Button>
            <Button 
              component={Link} 
              to="/login" 
              variant="outlined" 
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Войти
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home; 