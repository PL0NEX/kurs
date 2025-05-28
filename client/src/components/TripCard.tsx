import { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Avatar } from '@mui/material';
import { Link } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Массив фиксированных изображений с Pexels
const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1785493/pexels-photo-1785493.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=800'
];

// Статусы путешествий с локализацией
const STATUS_LABELS = {
  draft: 'Черновик',
  planned: 'Запланировано',
  active: 'В процессе',
  completed: 'Завершено',
  voting: 'Голосование'
};

// Цвета статусов
const STATUS_COLORS = {
  draft: 'default',
  planned: 'primary',
  active: 'success',
  completed: 'secondary',
  voting: 'warning'
};

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'voting';
  imageUrl?: string;
  budget: number;
  participants: number;
}

interface TripCardProps {
  trip: Trip;
}

const TripCard = ({ trip }: TripCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Используем хеш от ID для выбора изображения по умолчанию
  const getImageForTrip = (id: string) => {
    // Простой хеш на основе суммы кодов символов ID
    const hash = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = hash % DEFAULT_IMAGES.length;
    return DEFAULT_IMAGES[index];
  };

  // Форматирование дат
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return dateString;
    }
  };

  // Форматирование суммы в рубли
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Определение отображаемого URL изображения
  const displayImageUrl = imageError || !trip.imageUrl 
    ? getImageForTrip(trip.id)
    : trip.imageUrl;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6
        }
      }}
      component={Link}
      to={`/trips/${trip.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <CardMedia
        component="img"
        height="140"
        image={displayImageUrl}
        alt={trip.title}
        onError={() => setImageError(true)}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
            {trip.title}
          </Typography>
          <Chip 
            label={STATUS_LABELS[trip.status] || trip.status} 
            size="small" 
            color={STATUS_COLORS[trip.status] as any || 'default'} 
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '40px'
          }}
        >
          {trip.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2">
            {trip.participants} {trip.participants === 1 ? 'участник' : 
              trip.participants > 1 && trip.participants < 5 ? 'участника' : 'участников'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceWalletIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2">
            Бюджет: {formatAmount(trip.budget || 0)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TripCard; 