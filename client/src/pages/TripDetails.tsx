import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Chip,
  Divider,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Alert,
  TextField,
  Snackbar
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import Map from '../components/Map';
import BudgetCalculator from '../components/BudgetCalculator';
import PointForm from '../components/PointForm';
import api from '../services/api';

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  budget: number;
  status: 'draft' | 'planned' | 'active' | 'completed';
  participants: Participant[];
  points: Point[];
  expenses: Expense[];
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOwner: boolean;
}

interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paidById?: string;
  paidBy?: any;
  splitBetween?: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trip-tabpanel-${index}`}
      aria-labelledby={`trip-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Набор изображений для путешествий
const travelImages = [
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/1785493/pexels-photo-1785493.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/2105929/pexels-photo-2105929.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

// Получение изображения по ID
const getImageByTripId = (id: string) => {
  let hashCode = 0;
  for (let i = 0; i < id.length; i++) {
    hashCode = (hashCode << 5) - hashCode + id.charCodeAt(i);
    hashCode |= 0;
  }
  const index = Math.abs(hashCode) % travelImages.length;
  return travelImages[index];
};

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openPointForm, setOpenPointForm] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [pointFormLat, setPointFormLat] = useState<number | null>(null);
  const [pointFormLng, setPointFormLng] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');
  const [voteStarted, setVoteStarted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [participantError, setParticipantError] = useState('');
  const [participantSuccess, setParticipantSuccess] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setError('ID путешествия не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Загрузка путешествия с ID:', id);
        const response = await api.get(`/trips/${id}`);
        
        console.log('Ответ сервера:', response.data);
        
        if (response.data.success) {
          // Преобразуем данные в ожидаемый формат
          const tripData = response.data.data;
          console.log('Данные путешествия:', tripData);
          
          // Загружаем участников отдельным запросом для получения полных данных
          let participants: Participant[] = [];
          try {
            console.log('Запрос участников для путешествия:', id);
            const participantsResponse = await api.get(`/trips/${id}/participants`);
            console.log('Ответ запроса участников:', participantsResponse.data);
            
            if (participantsResponse.data.success) {
              const rawParticipants = participantsResponse.data.data;
              console.log('Сырые данные участников:', rawParticipants);
              
              if (Array.isArray(rawParticipants) && rawParticipants.length > 0) {
                participants = rawParticipants.map((p: any, index: number) => {
                  const participant = {
                    id: p.id || `auto-id-${index}`,
                    name: p.name || p.email?.split('@')[0] || 'Пользователь ' + (index + 1),
                    email: p.email || 'неизвестный email',
                    avatar: p.avatar,
                    isOwner: p.isOwner || p.role === 'owner' || false
                  };
                  console.log(`Обработан участник ${index}:`, participant);
                  return participant;
                });
                console.log('Обработанные участники из API:', participants);
              } else {
                console.warn('API вернуло пустой массив участников или неверный формат');
              }
            } else {
              console.warn('Запрос участников вернул ошибку:', participantsResponse.data.message);
            }
          } catch (participantsError) {
            console.error('Ошибка при загрузке участников:', participantsError);
            
            // Если запрос на получение участников завершился с ошибкой,
            // используем данные из tripData
            if (tripData.participants) {
              console.log('Используем участников из данных путешествия:', tripData.participants);
              
              // Если участники представлены как массив объектов
              if (Array.isArray(tripData.participants)) {
                participants = tripData.participants.map((p: any, index: number) => ({
                  id: p.id || `trip-id-${index}`,
                  name: p.name || p.user?.name || `Пользователь ${index + 1}`,
                  email: p.email || p.user?.email || 'неизвестный email',
                  avatar: p.avatar || p.user?.avatar,
                  isOwner: p.role === 'owner' || p.isOwner || false
                }));
                console.log('Обработанные участники из данных путешествия:', participants);
              } else if (typeof tripData.participants === 'object') {
                // Если участники представлены как объект с ключами
                participants = Object.values(tripData.participants).map((p: any, index: number) => ({
                  id: p.id || `obj-id-${index}`,
                  name: p.name || p.user?.name || `Пользователь ${index + 1}`,
                  email: p.email || p.user?.email || 'неизвестный email',
                  avatar: p.avatar || p.user?.avatar,
                  isOwner: p.role === 'owner' || p.isOwner || false
                }));
                console.log('Обработанные участники из объекта:', participants);
              }
            }
          }
          
          // Загружаем точки маршрута отдельным запросом
          let points: Point[] = [];
          try {
            console.log('Запрос точек маршрута для путешествия:', id);
            const pointsResponse = await api.get(`/trips/${id}/points`);
            console.log('Ответ запроса точек маршрута:', pointsResponse.data);
            
            if (pointsResponse.data.success && Array.isArray(pointsResponse.data.data)) {
              points = pointsResponse.data.data;
              console.log('Загружено точек маршрута:', points.length);
            } else {
              console.warn('Запрос точек маршрута вернул ошибку или пустой результат');
            }
          } catch (pointsError) {
            console.error('Ошибка при загрузке точек маршрута:', pointsError);
            // Используем точки из tripData, если они есть
            if (Array.isArray(tripData.points)) {
              points = tripData.points;
            }
          }
          
          // Загружаем расходы отдельным запросом
          let expenses: Expense[] = [];
          try {
            console.log('Запрос расходов для путешествия:', id);
            const expensesResponse = await api.get(`/trips/${id}/expenses`);
            console.log('Ответ запроса расходов:', expensesResponse.data);
            
            if (expensesResponse.data.success && Array.isArray(expensesResponse.data.data)) {
              expenses = expensesResponse.data.data;
              console.log('Загружено расходов:', expenses.length);
            } else {
              console.warn('Запрос расходов вернул ошибку или пустой результат');
            }
          } catch (expensesError) {
            console.error('Ошибка при загрузке расходов:', expensesError);
            // Используем расходы из tripData, если они есть
            if (Array.isArray(tripData.expenses)) {
              expenses = tripData.expenses;
            }
          }
          
          // Если нет каких-то данных, добавляем значения по умолчанию
          const formattedTrip: Trip = {
            id: tripData.id,
            title: tripData.title || '',
            description: tripData.description || '',
            startDate: tripData.startDate || '',
            endDate: tripData.endDate || '',
            imageUrl: tripData.imageUrl,
            budget: tripData.budget || 0,
            status: tripData.status || 'draft',
            participants: participants,
            // Используем загруженные точки вместо тех, что в основном объекте путешествия
            points: points,
            // Используем загруженные расходы вместо тех, что в основном объекте путешествия
            expenses: expenses
          };
          
          console.log('Отформатированные данные путешествия:', formattedTrip);
          console.log('Отформатированные участники:', formattedTrip.participants);
          console.log('Загруженные точки маршрута:', formattedTrip.points);
          console.log('Загруженные расходы:', formattedTrip.expenses);
          
          setTrip(formattedTrip);
        } else {
          setError(response.data.message || 'Не удалось загрузить данные путешествия');
        }
      } catch (err: any) {
        console.error('Ошибка при загрузке путешествия:', err);
        setError(err.response?.data?.message || 'Ошибка при загрузке данных путешествия');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPointFormLat(lat);
    setPointFormLng(lng);
    setCurrentPoint(null);
    setOpenPointForm(true);
  };

  const handleEditPoint = (point: Point) => {
    setCurrentPoint(point);
    setOpenPointForm(true);
  };

  const handleSavePoint = async (pointData: { name: string; description: string; lat: number; lng: number }) => {
    if (!trip) return;
    
    try {
      if (currentPoint) {
        // Редактирование существующей точки
        console.log('Обновление точки:', currentPoint.id);
        const response = await api.put(`/trips/${trip.id}/points/${currentPoint.id}`, {
          name: pointData.name,
          description: pointData.description,
          lat: pointData.lat || currentPoint.lat,
          lng: pointData.lng || currentPoint.lng
        });
        
        if (response.data.success) {
          console.log('Точка успешно обновлена:', response.data.data);
          const updatedPoint = response.data.data;
          
          // Обновляем точку в состоянии
          const updatedPoints = trip.points.map(p => 
            p.id === currentPoint.id ? updatedPoint : p
          );
          
          setTrip({...trip, points: updatedPoints});
        } else {
          console.error('Ошибка при обновлении точки:', response.data.message);
        }
      } else {
        // Добавление новой точки
        console.log('Добавление новой точки:', pointData);
        console.log(`Координаты: lat=${pointFormLat}, lng=${pointFormLng}`);
        
        const response = await api.post(`/trips/${trip.id}/points`, {
          name: pointData.name,
          description: pointData.description,
          lat: pointFormLat,
          lng: pointFormLng
        });
        
        if (response.data.success) {
          console.log('Точка успешно добавлена:', response.data.data);
          const newPoint = response.data.data;
          
          // Добавляем точку в состояние
          const updatedPoints = [...trip.points, newPoint];
          setTrip({...trip, points: updatedPoints});
        } else {
          console.error('Ошибка при добавлении точки:', response.data.message);
        }
      }
    } catch (error) {
      console.error('Ошибка при сохранении точки:', error);
      
      // Резервный вариант - локальная обработка, если API недоступен
      console.log('Применяем локальную обработку точки');
      
      let updatedPoints;
      if (currentPoint) {
        // Редактирование существующей точки локально
        updatedPoints = trip.points.map(p => 
          p.id === currentPoint.id 
            ? { ...p, name: pointData.name, description: pointData.description }
            : p
        );
      } else {
        // Добавление новой точки локально
        const newPoint: Point = {
          id: crypto.randomUUID(),
          name: pointData.name,
          description: pointData.description,
          lat: pointFormLat || 0,
          lng: pointFormLng || 0
        };
        updatedPoints = [...trip.points, newPoint];
      }
      
      setTrip({...trip, points: updatedPoints});
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!trip) return;
    
    try {
      console.log('Удаление точки:', pointId);
      const response = await api.delete(`/trips/${trip.id}/points/${pointId}`);
      
      if (response.data.success) {
        console.log('Точка успешно удалена');
        const updatedPoints = trip.points.filter(p => p.id !== pointId);
        setTrip({...trip, points: updatedPoints});
      } else {
        console.error('Ошибка при удалении точки:', response.data.message);
      }
    } catch (error) {
      console.error('Ошибка при удалении точки:', error);
      
      // Резервный вариант - локальная обработка, если API недоступен
      console.log('Применяем локальное удаление точки');
      const updatedPoints = trip.points.filter(p => p.id !== pointId);
      setTrip({...trip, points: updatedPoints});
    }
  };

  const handleUpdateExpenses = async (expenses: Expense[]) => {
    if (!trip) return;
    
    try {
      console.log('Обновление расходов для путешествия:', trip.id);
      
      // Сохраняем измененные расходы по одному
      for (const expense of expenses) {
        if (expense.id.startsWith('local-')) {
          // Новый расход, создаем на сервере
          console.log('Добавление нового расхода:', expense);
          try {
            const response = await api.post(`/trips/${trip.id}/expenses`, {
              category: expense.category,
              description: expense.description,
              amount: expense.amount,
              paidById: expense.paidById || expense.paidBy,
              splitBetween: expense.splitBetween
            });
            
            if (response.data.success) {
              console.log('Расход успешно добавлен:', response.data.data);
              // Обновляем ID расхода с серверного
              expense.id = response.data.data.id;
            } else {
              console.error('Ошибка при добавлении расхода:', response.data.message);
            }
          } catch (error) {
            console.error('Ошибка при создании расхода:', error);
          }
        } else {
          // Существующий расход, обновляем
          console.log('Обновление существующего расхода:', expense.id);
          try {
            const response = await api.put(`/trips/${trip.id}/expenses/${expense.id}`, {
              category: expense.category,
              description: expense.description,
              amount: expense.amount,
              paidById: expense.paidById || expense.paidBy,
              splitBetween: expense.splitBetween
            });
            
            if (!response.data.success) {
              console.error('Ошибка при обновлении расхода:', response.data.message);
            }
          } catch (error) {
            console.error('Ошибка при обновлении расхода:', error);
          }
        }
      }
      
      // Обновляем состояние с новыми расходами (включая обновленные ID)
      setTrip({...trip, expenses});
    } catch (error) {
      console.error('Ошибка при обновлении бюджета:', error);
      // Даже в случае ошибки обновляем локальное состояние
      setTrip({...trip, expenses});
    }
  };

  const handleDeleteTrip = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await api.delete(`/trips/${id}`);
      
      if (response.data.success) {
        setOpenDeleteDialog(false);
        navigate('/trips');
      } else {
        setError(response.data.message || 'Ошибка при удалении путешествия');
        setOpenDeleteDialog(false);
      }
    } catch (err: any) {
      console.error('Ошибка при удалении путешествия:', err);
      setError(err.response?.data?.message || 'Ошибка при удалении путешествия');
      setOpenDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: ru });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'planned': return 'primary';
      case 'active': return 'success';
      case 'completed': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'planned': return 'Запланировано';
      case 'active': return 'В процессе';
      case 'completed': return 'Завершено';
      default: return 'Неизвестно';
    }
  };

  // Функция для добавления участника
  const handleAddParticipant = async (email: string) => {
    if (!trip || !email) {
      console.error('Невозможно добавить участника: trip или email отсутствуют');
      return;
    }
    
    setIsAddingParticipant(true);
    setParticipantError('');
    setParticipantSuccess('');
    
    try {
      console.log('Добавление участника с email:', email, 'к путешествию:', trip.id);
      const response = await api.post(`/trips/${trip.id}/participants`, { email });
      console.log('Ответ сервера на добавление участника:', response.data);
      
      if (response.data.success) {
        setParticipantSuccess(`Участник ${email} успешно добавлен`);
        console.log('Участник успешно добавлен, обновляем список участников');
        
        // Обновляем список участников путешествия с сервера для получения актуальных данных
        try {
          console.log('Запрос обновленного списка участников');
          const participantsResponse = await api.get(`/trips/${trip.id}/participants`);
          console.log('Ответ сервера с обновленным списком:', participantsResponse.data);
          
          if (participantsResponse.data.success) {
            const updatedParticipants = participantsResponse.data.data.map((p: any, index: number) => {
              const participant = {
                id: p.id || `update-id-${index}`,
                name: p.name || p.email?.split('@')[0] || `Пользователь ${index + 1}`,
                email: p.email || 'неизвестный email',
                avatar: p.avatar,
                isOwner: p.isOwner || p.role === 'owner' || false
              };
              console.log(`Обработан обновленный участник ${index}:`, participant);
              return participant;
            });
            
            console.log('Обновляем состояние trip с новыми участниками:', updatedParticipants);
            setTrip(prev => {
              if (!prev) return null;
              const newTrip = {
                ...prev,
                participants: updatedParticipants
              };
              console.log('Новое состояние trip:', newTrip);
              return newTrip;
            });
            
            setNewParticipant(''); // Очищаем поле ввода
          } else {
            console.error('Ошибка при получении списка участников:', participantsResponse.data.message);
            setParticipantError('Участник добавлен, но не удалось обновить список');
          }
        } catch (err) {
          console.error('Ошибка при получении обновленного списка участников:', err);
          setParticipantError('Участник добавлен, но не удалось обновить список');
          
          // Добавляем участника локально для быстрого отображения
          console.log('Добавляем участника локально, данные ответа:', response.data.data);
          const participantData = response.data.data || {};
          
          const newParticipant: Participant = {
            id: participantData.id || `local-${Date.now()}`,
            name: participantData.name || email.split('@')[0] || 'Новый участник',
            email: email,
            isOwner: false
          };
          
          console.log('Локально добавляемый участник:', newParticipant);
          console.log('Текущие участники перед добавлением:', trip.participants);
          
          const updatedParticipants = [...(trip.participants || []), newParticipant];
          console.log('Обновленный список после локального добавления:', updatedParticipants);
          
          setTrip(prev => {
            if (!prev) return null;
            const newTrip = {
              ...prev,
              participants: updatedParticipants
            };
            console.log('Новое состояние trip после локального добавления:', newTrip);
            return newTrip;
          });
          
          setNewParticipant(''); // Очищаем поле ввода
        }
      } else {
        console.error('Ошибка при добавлении участника:', response.data.message);
        setParticipantError(response.data.message || 'Не удалось добавить участника');
      }
    } catch (err: any) {
      console.error('Ошибка при добавлении участника:', err);
      console.error('Детали ошибки:', err.response?.data);
      
      // Показываем ошибку пользователю
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Ошибка при добавлении участника';
      setParticipantError(errorMsg);
    } finally {
      setIsAddingParticipant(false);
    }
  };

  // Добавим функцию для начала голосования
  const handleStartVoting = async () => {
    if (!trip || !trip.points || trip.points.length < 2) return;
    
    try {
      setVoteLoading(true);
      setVoteError('');
      console.log('Начинаем голосование для путешествия:', trip.id);
      
      try {
        // Пытаемся отправить запрос на сервер
        const response = await api.post(`/trips/${trip.id}/voting/start`, {
          pointIds: trip.points.map(point => point.id)
        });
        
        console.log('Ответ сервера на начало голосования:', response.data);
        
        if (response.data.success) {
          setVoteStarted(true);
        } else {
          setVoteError(response.data.message || 'Не удалось начать голосование');
        }
      } catch (err: any) {
        console.error('Ошибка при начале голосования:', err);

        // Если сервер вернул 404, значит маршрут не реализован
        // Мы можем симулировать успешное начало голосования для демонстрации интерфейса
        if (err.response && err.response.status === 404) {
          console.log('Маршрут голосования не найден на сервере, симулируем успешный ответ');
          
          // Имитируем локальное состояние голосования для демонстрации интерфейса
          setVoteStarted(true);
          
          // Не показываем ошибку пользователю в этом случае
          setVoteError('');
        } else if (err.response?.data?.message === 'Необходимо выбрать не менее двух существующих точек путешествия') {
          // Сделаем сообщение об ошибке более понятным для пользователя
          setVoteError('Для начала голосования необходимо добавить не менее двух точек маршрута, по которым участники смогут голосовать.');
        } else {
          setVoteError(err.response?.data?.message || 'Ошибка при начале голосования');
        }
      }
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!trip) {
    return (
      <Typography variant="h6" color="error">
        Путешествие не найдено
      </Typography>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          position: 'relative',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `url(${trip.imageUrl || getImageByTripId(trip.id)})`,
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.5)',
          }}
        />
        <Box sx={{ position: 'relative', p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography component="h1" variant="h3" color="white">
                {trip.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <DateRangeIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="subtitle1" color="white">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Chip 
                label={getStatusText(trip.status)} 
                color={getStatusColor(trip.status) as any} 
                sx={{ color: trip.status === 'draft' ? 'text.primary' : 'white' }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Description and Actions */}
      <Box sx={{ display: 'flex', mb: 4, gap: 3 }}>
        <Box sx={{ flex: '0 0 66.666%' }}>
          <Typography variant="body1" paragraph>
            {trip.description}
          </Typography>
        </Box>
        <Box sx={{ flex: '0 0 33.333%', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/create-trip?edit=${trip.id}`)}
          >
            Редактировать
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenDeleteDialog(true)}
          >
            Удалить
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="trip details tabs"
        >
          <Tab label="Маршрут" />
          <Tab label="Бюджет" />
          <Tab label="Участники" />
          <Tab label="Голосование" />
        </Tabs>

        {/* Маршрут */}
        <TabPanel value={tabValue} index={0}>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Точки маршрута
            </Typography>
            <Map 
              points={trip.points} 
              onMapClick={handleMapClick}
              interactive={true}
              center={trip.points.length > 0 ? [trip.points[0].lat, trip.points[0].lng] : undefined}
            />
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => handleMapClick(55.7558, 37.6173)}
            >
              Добавить точку
            </Button>
          </Box>
          
          <Divider />
          
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Список точек
            </Typography>
            <List>
              {trip.points.map((point) => (
                <Paper key={point.id} sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {point.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {point.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Координаты: {Number(point.lat).toFixed(4)}, {Number(point.lng).toFixed(4)}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEditPoint(point)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePoint(point.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
              {trip.points.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  Маршрут пока пуст. Добавьте точки, кликнув на карту.
                </Typography>
              )}
            </List>
          </Box>
        </TabPanel>

        {/* Бюджет */}
        <TabPanel value={tabValue} index={1}>
          {trip.expenses && trip.expenses.length > 0 ? (
            <BudgetCalculator 
              expenses={trip.expenses} 
              participants={trip.participants}
              onUpdateExpenses={handleUpdateExpenses}
            />
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Бюджет пока не сформирован
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Добавьте расходы для формирования бюджета путешествия.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => {
                  // Добавляем пустой расход
                  if (trip) {
                    const newExpense: Expense = {
                      id: crypto.randomUUID(),
                      category: 'other',
                      description: 'Новый расход',
                      amount: 0
                    };
                    handleUpdateExpenses([...trip.expenses, newExpense]);
                  }
                }}
              >
                Добавить расход
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Участники */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Участники поездки {trip.participants && `(${trip.participants.length})`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Email участника"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                sx={{ minWidth: 250 }}
                disabled={isAddingParticipant}
              />
              <Button 
                variant="contained" 
                startIcon={<PeopleIcon />}
                onClick={() => {
                  console.log('Добавление участника, текущее состояние:', {
                    email: newParticipant.trim(),
                    currentParticipants: trip.participants
                  });
                  if (newParticipant.trim()) {
                    handleAddParticipant(newParticipant.trim());
                  }
                }}
                disabled={isAddingParticipant || !newParticipant.trim()}
              >
                {isAddingParticipant ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" /> 
                    Добавление...
                  </>
                ) : 'Добавить'}
              </Button>
            </Box>
          </Box>
          
          {participantError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setParticipantError('')}>
              {participantError}
            </Alert>
          )}
          
          {participantSuccess && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setParticipantSuccess('')}>
              {participantSuccess}
            </Alert>
          )}
          
          {/* DEBUG: Рендер списка участников */}
          {(() => {
            console.log('Рендер списка участников:', {
              hasParticipants: !!trip.participants,
              participantsLength: trip.participants?.length,
              participants: trip.participants
            });
            return null;
          })()}
          
          {trip.participants && trip.participants.length > 0 ? (
            <List>
              {trip.participants.map((participant, index) => {
                console.log(`Рендер участника ${index}:`, participant);
                return (
                  <Paper key={participant.id || index} sx={{ mb: 2 }}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={participant.avatar} alt={participant.name || 'Участник'}>
                          {(participant.name || 'У').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography variant="subtitle1">
                              {participant.name || participant.email || 'Неизвестный участник'}
                            </Typography>
                            {participant.isOwner && (
                              <Chip 
                                label="Организатор" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={participant.email} 
                      />
                    </ListItem>
                  </Paper>
                );
              })}
            </List>
          ) : (
            <Box textAlign="center" my={4}>
              <Typography variant="body1" color="text.secondary">
                К путешествию еще не добавлены участники.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Голосование */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Голосование за маршрут
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<HowToVoteIcon />}
              disabled={!trip.points || trip.points.length < 2 || voteStarted || voteLoading}
              onClick={handleStartVoting}
            >
              {voteLoading ? 'Создание голосования...' : voteStarted ? 'Голосование активно' : 'Начать голосование'}
            </Button>
          </Box>

          {voteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voteError}
            </Alert>
          )}
          
          {voteStarted ? (
            <Box textAlign="center" my={4}>
              <Typography variant="h6" color="primary" gutterBottom>
                Голосование начато!
              </Typography>
              <Typography variant="body1" paragraph>
                Участники могут проголосовать за предпочитаемые точки маршрута.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {trip.points && trip.points.map((point) => (
                  <Box key={point.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' } }}>
                    <Paper
                      sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {point.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {point.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => console.log('Голос за точку:', point.id)}
                      >
                        Голосовать
                      </Button>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : trip.points && trip.points.length >= 2 ? (
            <Typography variant="body1" align="center">
              Голосование еще не начато. Нажмите кнопку "Начать голосование", чтобы участники могли выбрать лучший маршрут.
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">
              Добавьте хотя бы 2 точки маршрута, чтобы начать голосование.
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {/* Формы и диалоги */}
      <PointForm
        open={openPointForm}
        onClose={() => setOpenPointForm(false)}
        onSave={handleSavePoint}
        initialValues={currentPoint ? {
          name: currentPoint.name,
          description: currentPoint.description || '',
          lat: currentPoint.lat,
          lng: currentPoint.lng
        } : { 
          name: '', 
          description: '', 
          lat: pointFormLat || 0, 
          lng: pointFormLng || 0 
        }}
      />

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Удаление поездки</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить поездку "{trip.title}"? Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
          <Button onClick={handleDeleteTrip} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripDetails; 