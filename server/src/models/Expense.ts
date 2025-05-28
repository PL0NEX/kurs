import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Trip } from './Trip';
import { User } from './User';

export enum ExpenseCategory {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  FOOD = 'food',
  ACTIVITIES = 'activities',
  OTHER = 'other'
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER
  })
  category: ExpenseCategory;

  @ManyToOne(() => Trip, trip => trip.expenses, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  @ManyToOne(() => User, user => user.expenses)
  @JoinColumn({ name: 'paidById' })
  paidBy: User;

  @Column()
  paidById: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'expense_splits',
    joinColumn: {
      name: 'expenseId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    }
  })
  splitBetween: User[];

  @Column({ nullable: true })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 