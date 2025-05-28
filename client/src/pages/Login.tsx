import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Link as MuiLink,
  Alert,
  Container,
  CssBaseline
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Используем локальное фоновое изображение вместо unsplash
const backgroundImage = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Используем контекст аутентификации
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Тримируем email, чтобы избежать проблем с пробелами
      const trimmedEmail = email.trim();
      console.log('Отправляю данные:', { email: trimmedEmail, password });
      
      // Используем наш настроенный api вместо axios
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password
      });
      
      console.log('Ответ сервера:', response.data);
      
      if (response.data.success) {
        // Сохранение токена и данных пользователя через контекст
        login(response.data.data.token, response.data.data.user);
        setLoading(false);
        navigate('/trips');
      } else {
        setError(response.data.message || 'Ошибка при входе');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response) {
        console.log('Ошибка ответа:', err.response.data);
        setError(err.response.data.message || 'Неверный email или пароль');
      } else if (err.request) {
        console.log('Ошибка запроса:', err.request);
        setError('Ошибка соединения с сервером');
      } else {
        setError('Произошла ошибка при обработке запроса');
      }
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Box
            sx={{
              m: 1,
              bgcolor: 'secondary.main',
              color: 'white',
              width: 40,
              height: 40,
              display: 'flex',
              borderRadius: '50%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Вход в систему
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box 
            component="form" 
            noValidate 
            onSubmit={handleSubmit} 
            sx={{ 
              mt: 1, 
              width: '100%'
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(e.target.value.trim())}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Выполняется вход...' : 'Войти'}
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <MuiLink component={Link} to="/register" variant="body2">
                {"Нет аккаунта? Зарегистрироваться"}
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 