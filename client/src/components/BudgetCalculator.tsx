import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Autocomplete,
  Alert,
  FormControl,
  InputLabel,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOwner: boolean;
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

interface BudgetCalculatorProps {
  expenses: Expense[];
  participants: Participant[];
  onUpdateExpenses: (expenses: Expense[]) => void;
}

const categories = [
  { value: 'accommodation', label: 'Проживание' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'food', label: 'Питание' },
  { value: 'activities', label: 'Развлечения' },
  { value: 'other', label: 'Прочее' }
];

const BudgetCalculator = ({ expenses: initialExpenses, participants, onUpdateExpenses }: BudgetCalculatorProps) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Обновляем состояние при изменении входных данных
    setExpenses(initialExpenses);
    
    // Рассчитываем общую сумму расходов
    const total = initialExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    setTotalAmount(total);
  }, [initialExpenses]);

  const handleAddExpense = () => {
    const newExpense: Expense = {
      id: `local-${Date.now()}`, // Используем префикс "local-" для новых расходов
      category: 'other',
      description: 'Новый расход',
      amount: 0,
      paidById: participants.length > 0 ? participants[0].id : undefined,
      splitBetween: participants.map(p => p.id)
    };
    
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    setEditMode({ ...editMode, [newExpense.id]: true });
    onUpdateExpenses(updatedExpenses);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    onUpdateExpenses(updatedExpenses);
    
    // Обновляем общую сумму
    const total = updatedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    setTotalAmount(total);
  };

  const handleEditExpense = (id: string) => {
    setEditMode({ ...editMode, [id]: true });
  };

  const handleSaveExpense = (id: string, updatedExpense: Partial<Expense>) => {
    try {
      // Проверяем корректность суммы
      if (updatedExpense.amount !== undefined) {
        const amount = Number(updatedExpense.amount);
        if (isNaN(amount) || amount < 0) {
          setError('Сумма расхода должна быть положительным числом');
          return;
        }
      }
      
      const updatedExpenses = expenses.map(expense =>
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      );
      
      setExpenses(updatedExpenses);
      setEditMode({ ...editMode, [id]: false });
      setError('');
      
      // Обновляем общую сумму
      const total = updatedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      setTotalAmount(total);
      
      // Уведомляем родителя об изменениях
      onUpdateExpenses(updatedExpenses);
    } catch (err) {
      console.error('Ошибка при сохранении расхода:', err);
      setError('Произошла ошибка при сохранении расхода');
    }
  };

  const handleExpenseChange = (id: string, field: keyof Expense, value: any) => {
    const updatedExpenses = expenses.map(expense => {
      if (expense.id === id) {
        return { ...expense, [field]: value };
      }
      return expense;
    });

    setExpenses(updatedExpenses);
    onUpdateExpenses(updatedExpenses);
  };

  const handleSplitChange = (expenseId: string, participantId: string, isChecked: boolean) => {
    const updatedExpenses = expenses.map(expense => {
      if (expense.id === expenseId) {
        let splitBetween = [...(expense.splitBetween || [])];
        
        if (isChecked && !splitBetween.includes(participantId)) {
          splitBetween.push(participantId);
        } else if (!isChecked && splitBetween.includes(participantId)) {
          splitBetween = splitBetween.filter(id => id !== participantId);
        }
        
        return { ...expense, splitBetween };
      }
      return expense;
    });

    setExpenses(updatedExpenses);
    onUpdateExpenses(updatedExpenses);
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : 'Прочее';
  };

  const getParticipantName = (participantId?: string) => {
    if (!participantId) return 'Не указано';
    const participant = participants.find(p => p.id === participantId);
    return participant ? participant.name : 'Не указано';
  };

  const getSplitNames = (splitIds?: string[]) => {
    if (!splitIds || !splitIds.length) return 'Все участники';
    
    return splitIds
      .map(id => {
        const participant = participants.find(p => p.id === id);
        return participant ? participant.name : 'Неизвестный';
      })
      .join(', ');
  };

  const calculatePerPersonAmount = (expense: Expense) => {
    if (!expense.amount) return 0;
    if (!expense.splitBetween || expense.splitBetween.length === 0) {
      return participants.length > 0 ? expense.amount / participants.length : expense.amount;
    }
    return expense.amount / expense.splitBetween.length;
  };

  const calculateBalance = () => {
    // Создаем объект для отслеживания баланса каждого участника
    const balance: Record<string, number> = {};
    participants.forEach(participant => {
      balance[participant.id] = 0;
    });

    // Проходим по всем расходам
    expenses.forEach(expense => {
      const amount = expense.amount || 0;
      const paidById = expense.paidById || expense.paidBy;
      const splitBetween = expense.splitBetween || [];

      if (!paidById || splitBetween.length === 0) return;

      // Добавляем всю сумму тому, кто заплатил
      balance[paidById] += amount;

      // Вычитаем равные доли у всех, между кем разделен расход
      const splitAmount = amount / splitBetween.length;
      splitBetween.forEach(participantId => {
        balance[participantId] -= splitAmount;
      });
    });

    return balance;
  };

  const balances = calculateBalance();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Бюджет путешествия: {Number(totalAmount).toLocaleString('ru-RU')} ₽
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddExpense}
        >
          Добавить расход
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Категория</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Сумма (₽)</TableCell>
              <TableCell>Оплатил</TableCell>
              <TableCell>Разделено между</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Нет добавленных расходов
                </TableCell>
              </TableRow>
            ) : (
              expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {editMode[expense.id] ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={expense.category}
                          onChange={(e: SelectChangeEvent) => handleExpenseChange(expense.id, 'category', e.target.value)}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category.value} value={category.value}>
                              {category.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      getCategoryLabel(expense.category)
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[expense.id] ? (
                      <TextField
                        fullWidth
                        value={expense.description}
                        onChange={(e) => handleExpenseChange(expense.id, 'description', e.target.value)}
                        size="small"
                      />
                    ) : (
                      expense.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[expense.id] ? (
                      <TextField
                        fullWidth
                        type="number"
                        value={expense.amount}
                        onChange={(e) => handleExpenseChange(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        size="small"
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    ) : (
                      Number(expense.amount).toLocaleString('ru-RU')
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[expense.id] ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={expense.paidById || expense.paidBy || ''}
                          onChange={(e: SelectChangeEvent) => handleExpenseChange(expense.id, 'paidById', e.target.value)}
                        >
                          {participants.map((participant) => (
                            <MenuItem key={participant.id} value={participant.id}>
                              {participant.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      getParticipantName(expense.paidById || expense.paidBy)
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode[expense.id] ? (
                      <FormGroup row>
                        {participants.map((participant) => (
                          <FormControlLabel
                            key={participant.id}
                            control={
                              <Checkbox
                                checked={(expense.splitBetween || []).includes(participant.id)}
                                onChange={(e) => handleSplitChange(expense.id, participant.id, e.target.checked)}
                                size="small"
                              />
                            }
                            label={participant.name}
                          />
                        ))}
                      </FormGroup>
                    ) : (
                      getSplitNames(expense.splitBetween)
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex">
                      {editMode[expense.id] ? (
                        <Button 
                          size="small" 
                          onClick={() => setEditMode({ ...editMode, [expense.id]: false })}
                        >
                          Готово
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          onClick={() => handleEditExpense(expense.id)}
                        >
                          Изменить
                        </Button>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {expenses.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Расчет долей участников</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Участник</TableCell>
                  <TableCell>Оплатил: 0 ₽</TableCell>
                  <TableCell>Доля в расходах: 25 000 ₽</TableCell>
                  <TableCell>Должен: 25 000 ₽</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map(participant => {
                  const paid = expenses
                    .filter(e => e.paidById === participant.id)
                    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
                  
                  const share = expenses
                    .filter(e => e.splitBetween?.includes(participant.id))
                    .reduce((sum, expense) => {
                      const amount = expense.amount || 0;
                      const splitCount = expense.splitBetween?.length || 1;
                      return sum + (amount / splitCount);
                    }, 0);
                  
                  const balance = paid - share;
                  
                  return (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{Number(paid).toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>{Number(share).toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell>
                        {balance < 0 
                          ? <Typography color="error">{Number(Math.abs(balance)).toLocaleString('ru-RU')} ₽</Typography>
                          : balance > 0 
                            ? <Typography color="success.main">+{Number(balance).toLocaleString('ru-RU')} ₽</Typography>
                            : '0 ₽'
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Итого: {Number(totalAmount).toLocaleString('ru-RU')} руб.</Typography>
        </Box>
      )}

      <Paper sx={{ mt: 2, p: 2 }}>
        <Typography variant="h6" gutterBottom>Итого: {Number(totalAmount).toLocaleString('ru-RU')} руб.</Typography>
        
        <Typography variant="subtitle1" gutterBottom>Баланс участников:</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {participants.map((participant) => {
            const balance = balances[participant.id] || 0;
            return (
              <Chip
                key={participant.id}
                label={`${participant.name}: ${balance.toFixed(2)} руб.`}
                color={balance > 0 ? 'success' : balance < 0 ? 'error' : 'default'}
              />
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default BudgetCalculator; 