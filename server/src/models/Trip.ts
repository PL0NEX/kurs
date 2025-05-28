import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Point } from './Point';
import { Participant } from './Participant';
import { Expense } from './Expense';

export enum TripStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  VOTING = 'voting'
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.DRAFT
  })
  status: TripStatus;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => User, user => user.ownedTrips)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => Point, point => point.trip, {
    cascade: true
  })
  points: Point[];

  @OneToMany(() => Participant, participant => participant.trip, {
    cascade: true
  })
  participants: Participant[];

  @OneToMany(() => Expense, expense => expense.trip, {
    cascade: true
  })
  expenses: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Вычисляемое поле (не хранится в БД)
  get totalBudget(): number {
    if (!this.expenses || this.expenses.length === 0) return 0;
    return this.expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  }
} 