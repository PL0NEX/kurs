import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Grid
} from '@mui/material';

interface PointFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (point: { name: string; description: string; lat: number; lng: number }) => void;
  initialValues?: { name: string; description: string; lat: number; lng: number };
  isEdit?: boolean;
}

const PointForm = ({ 
  open, 
  onClose, 
  onSave, 
  initialValues = { name: '', description: '', lat: 0, lng: 0 },
  isEdit = false 
}: PointFormProps) => {
  const [point, setPoint] = useState(initialValues);
  const [errors, setErrors] = useState<{name?: string}>({});

  useEffect(() => {
    if (open) {
      setPoint(initialValues);
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPoint(prev => ({ ...prev, [name]: value }));
    
    // Очистка ошибки при изменении значения
    if (name === 'name' && errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: {name?: string} = {};
    if (!point.name.trim()) {
      newErrors.name = 'Название точки обязательно';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(point);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Редактировать точку' : 'Добавить точку'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Название"
              fullWidth
              value={point.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={point.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="lat"
              label="Широта"
              fullWidth
              type="number"
              value={point.lat}
              onChange={handleChange}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="lng"
              label="Долгота"
              fullWidth
              type="number"
              value={point.lng}
              onChange={handleChange}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEdit ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PointForm; 