import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { Point } from './Point';

@Entity('votes')
@Unique(['userId', 'pointId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.votes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Point, point => point.votes, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'pointId' })
  point: Point;

  @Column()
  pointId: string;

  @Column('int')
  value: number;

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 