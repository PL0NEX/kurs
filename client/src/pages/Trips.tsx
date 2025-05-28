import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import TripCard from '../components/TripCard';
import api from '../services/api'; // Используем настроенный API вместо прямого axios

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  budget: number;
  participants: number;
  status: 'draft' | 'planned' | 'active' | 'completed';
}

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          setError('Для просмотра путешествий необходимо авторизоваться');
          return;
        }
        
        // Используем настроенный API, токен автоматически будет добавлен через перехватчик
        const response = await api.get('/trips');
        
        if (response.data.success) {
          const fetchedTrips = response.data.data;
          
          // Преобразуем формат данных, если необходимо
          const formattedTrips = fetchedTrips.map((trip: any) => ({
            id: trip.id,
            title: trip.title,
            description: trip.description,
            startDate: trip.startDate,
            endDate: trip.endDate,
            imageUrl: trip.imageUrl,
            budget: trip.budget || 0,
            participants: trip.participants?.length || 1,
            status: trip.status
          }));
          
          setTrips(formattedTrips);
          setFilteredTrips(formattedTrips);
        } else {
          setError('Не удалось загрузить путешествия');
        }
      } catch (err) {
        console.error('Ошибка при загрузке путешествий:', err);
        setError('Ошибка при загрузке путешествий');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Фильтрация поездок по поиску и статусу
  useEffect(() => {
    let result = trips;
    
    // Фильтрация по поисковому запросу
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(trip => 
        trip.title.toLowerCase().includes(term) || 
        trip.description.toLowerCase().includes(term)
      );
    }
    
    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      result = result.filter(trip => trip.status === statusFilter);
    }
    
    setFilteredTrips(result);
  }, [searchTerm, statusFilter, trips]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Мои путешествия
        </Typography>
        <Button 
          component={Link} 
          to="/create-trip" 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Создать путешествие
        </Button>
      </Box>
      
      {/* Фильтры */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Поиск по названию или описанию"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="status-filter-label">Статус</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Статус"
              onChange={handleStatusChange}
            >
              <MenuItem value="all">Все</MenuItem>
              <MenuItem value="draft">Черновик</MenuItem>
              <MenuItem value="planned">Запланировано</MenuItem>
              <MenuItem value="active">В процессе</MenuItem>
              <MenuItem value="completed">Завершено</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Ошибка загрузки */}
      {error && (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
        </Box>
      )}
      
      {/* Список поездок */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredTrips.length > 0 ? (
        <Grid container spacing={3}>
          {filteredTrips.map((trip) => (
            <Grid xs={12} sm={6} md={4} key={trip.id}>
              <TripCard trip={trip} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" my={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Путешествий не найдено
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'all' 
              ? 'Попробуйте изменить параметры поиска' 
              : 'Создайте свое первое путешествие'}
          </Typography>
          {!searchTerm && statusFilter === 'all' && !error && (
            <Button 
              component={Link} 
              to="/create-trip" 
              variant="contained" 
              startIcon={<AddIcon />}
            >
              Создать путешествие
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Trips; 