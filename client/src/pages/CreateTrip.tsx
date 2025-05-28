import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid as MuiGrid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import api from '../services/api';

const steps = ['Основная информация', 'Участники', 'Подтверждение'];

// Компонент Grid обертка для исправления ошибок TypeScript
const Grid = (props: any) => {
  return <MuiGrid item {...props} />;
};

const CreateTrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editTripId = searchParams.get('edit');
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: 'draft',
    imageUrl: ''
  });
  
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Загрузка данных путешествия при редактировании
  useEffect(() => {
    const fetchTripForEdit = async () => {
      if (!editTripId) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/trips/${editTripId}`);
        
        if (response.data.success) {
          const tripData = response.data.data;
          
          // Устанавливаем режим редактирования
          setIsEditMode(true);
          
          // Заполняем форму данными существующего путешествия
          setFormData({
            title: tripData.title || '',
            description: tripData.description || '',
            startDate: tripData.startDate ? new Date(tripData.startDate) : null,
            endDate: tripData.endDate ? new Date(tripData.endDate) : null,
            status: tripData.status || 'draft',
            imageUrl: tripData.imageUrl || ''
          });
          
          // Добавляем участников, если они есть
          if (tripData.participants && Array.isArray(tripData.participants)) {
            const participantEmails = tripData.participants
              .filter((p: any) => p.email && !p.isOwner)
              .map((p: any) => p.email);
            setParticipants(participantEmails);
          }
        } else {
          setError('Не удалось загрузить данные путешествия для редактирования');
        }
      } catch (err: any) {
        console.error('Ошибка при загрузке путешествия для редактирования:', err);
        setError('Ошибка при загрузке путешествия для редактирования');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripForEdit();
  }, [editTripId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStatusChange = (e: any) => {
    setFormData(prev => ({ ...prev, status: e.target.value }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    
    // Очистка ошибки при изменении даты
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants(prev => [...prev, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const validateFirstStep = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обязательна';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Дата окончания обязательна';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'Дата окончания должна быть позже даты начала';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateFirstStep()) {
      return;
    }
    
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateFirstStep()) return;
    
    setLoading(true);
    setError('');
    
    console.log('Отправка данных путешествия:', { 
      ...formData, 
      participants: participants 
    });
    
    const tripData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      imageUrl: formData.imageUrl,
      startDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
      endDate: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null
    };
    
    try {
      let response;
      
      if (isEditMode && editTripId) {
        // Если редактируем существующее путешествие
        console.log('Обновление существующего путешествия с ID:', editTripId);
        response = await api.put(`/trips/${editTripId}`, tripData);
        console.log('Ответ сервера (обновление):', response.data);
      } else {
        // Если создаем новое путешествие
        console.log('Создание нового путешествия');
        response = await api.post('/trips', tripData);
        console.log('Ответ сервера (создание):', response.data);
      }
      
      if (response.data.success) {
        // Если есть участники и это не режим редактирования, добавляем их
        // (при редактировании участники обновляются через отдельный API)
        if (participants.length > 0 && !isEditMode) {
          const tripId = response.data.data.id;
          console.log(`Добавление ${participants.length} участников к путешествию:`, tripId);
          
          // Добавляем каждого участника по отдельности
          for (const email of participants) {
            try {
              console.log(`Добавление участника с email ${email}`);
              const participantResponse = await api.post(`/trips/${tripId}/participants`, { email });
              console.log(`Ответ на добавление участника ${email}:`, participantResponse.data);
            } catch (participantError: any) {
              console.error(`Ошибка при добавлении участника ${email}:`, participantError);
              
              // Выводим детальную информацию об ошибке
              if (participantError.response) {
                console.error('Детали ошибки:', {
                  status: participantError.response.status,
                  data: participantError.response.data,
                  headers: participantError.response.headers
                });
              }
              
              // Показываем ошибку, но продолжаем добавление других участников
              if (!error) {
                setError(`Не удалось добавить участника ${email}: ${
                  participantError.response?.data?.message || 'Ошибка сервера'
                }`);
              }
            }
          }
        }
        
        // После всех операций переходим к списку путешествий
        setLoading(false);
        navigate('/trips');
      } else {
        setError(response.data.message || 'Ошибка при создании путешествия');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении путешествия:', err);
      
      // Выводим детальную информацию об ошибке
      if (err.response) {
        console.error('Детали ошибки:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      }
      
      setError(err.response?.data?.message || 'Ошибка при сохранении путешествия. Пожалуйста, попробуйте позже.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Редактирование путешествия' : 'Создание нового путешествия'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !error ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 0 && (
            <MuiGrid container spacing={3}>
              <Grid xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Название путешествия"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={4}
                  label="Описание"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                  <DatePicker
                    label="Дата начала"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                  <DatePicker
                    label="Дата окончания"
                    value={formData.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="URL изображения (опционально)"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </Grid>
              <Grid xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Статус</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    value={formData.status}
                    label="Статус"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="draft">Черновик</MenuItem>
                    <MenuItem value="planned">Запланировано</MenuItem>
                  </Select>
                  <FormHelperText>
                    Если вы еще не уверены в деталях, выберите "Черновик"
                  </FormHelperText>
                </FormControl>
              </Grid>
            </MuiGrid>
          )}
          
          {activeStep === 1 && (
            <MuiGrid container spacing={3}>
              <Grid xs={12}>
                <Typography variant="h6" gutterBottom>
                  Пригласить участников
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Укажите email адреса участников. Они получат приглашение присоединиться к вашему путешествию.
                </Typography>
              </Grid>
              <Grid xs={12} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Email участника"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  placeholder="email@example.com"
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.trim()}
                  sx={{ minWidth: '120px' }}
                >
                  Добавить
                </Button>
              </Grid>
              
              <Grid xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Добавленные участники ({participants.length})
                </Typography>
                {participants.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет добавленных участников
                  </Typography>
                ) : (
                  <Box component="ul" sx={{ pl: 2 }}>
                    {participants.map((participant, index) => (
                      <Box 
                        component="li" 
                        key={index}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1
                        }}
                      >
                        <Typography variant="body1">{participant}</Typography>
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveParticipant(index)}
                        >
                          Удалить
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </MuiGrid>
          )}
          
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Подтверждение данных
              </Typography>
              
              <MuiGrid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Название</Typography>
                  <Typography variant="body1">{formData.title}</Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Статус</Typography>
                  <Typography variant="body1">
                    {formData.status === 'draft' ? 'Черновик' : 'Запланировано'}
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Дата начала</Typography>
                  <Typography variant="body1">
                    {formData.startDate ? format(formData.startDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Дата окончания</Typography>
                  <Typography variant="body1">
                    {formData.endDate ? format(formData.endDate, 'd MMMM yyyy', { locale: ru }) : '—'}
                  </Typography>
                </Grid>
                <Grid xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Описание</Typography>
                  <Typography variant="body1">{formData.description}</Typography>
                </Grid>
                
                <Grid xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Участники ({participants.length})
                  </Typography>
                  {participants.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Нет добавленных участников
                    </Typography>
                  ) : (
                    <Box component="ul" sx={{ pl: 2 }}>
                      {participants.map((participant, index) => (
                        <Box component="li" key={index}>
                          <Typography variant="body1">{participant}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
              </MuiGrid>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Назад
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать путешествие'}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                >
                  Далее
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CreateTrip; 