import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import type {
  Subscription,
  Usage,
  SubscriptionPlan,
  ActionType,
} from '../../../shared/proto-types/subscription';

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  price: string;
  status: string;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface UsageRow {
  id: string;
  user_id: string;
  action_type: string;
  used_count: number;
  max_count: number;
  period_start: Date;
  period_end: Date;
}

interface PlanConfig {
  price: number;
  actionType: string;
  maxCount: number;
}

const PLAN_CONFIG: Record<string, PlanConfig> = {
  TALENT_HUNTER_FREE: { price: 0, actionType: 'JOB_POST', maxCount: 10 },
  TALENT_HUNTER_PRO: { price: 30, actionType: 'JOB_POST', maxCount: -1 },
  JOB_HUNTER_FREE: { price: 0, actionType: 'JOB_APPLY', maxCount: 10 },
  JOB_HUNTER_PRO: { price: 5, actionType: 'JOB_APPLY', maxCount: -1 },
};

function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function toProtoSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan as SubscriptionPlan,
    price: parseFloat(row.price),
    status: row.status as Subscription['status'],
    startsAt: row.starts_at?.toISOString() ?? '',
    endsAt: row.ends_at?.toISOString() ?? '',
    createdAt: row.created_at?.toISOString() ?? '',
    updatedAt: row.updated_at?.toISOString() ?? '',
  };
}

function toProtoUsage(row: UsageRow): Usage {
  return {
    id: row.id,
    userId: row.user_id,
    actionType: row.action_type as ActionType,
    usedCount: row.used_count,
    maxCount: row.max_count,
    periodStart: row.period_start?.toISOString() ?? '',
    periodEnd: row.period_end?.toISOString() ?? '',
  };
}

export class SubscriptionRepository {
  constructor(private readonly db: Knex) {}

  private async getOrCreateUsage(userId: string, actionType: string): Promise<UsageRow> {
    const { start, end } = getCurrentPeriod();
    let usage = await this.db<UsageRow>('usage')
      .where({ user_id: userId, action_type: actionType })
      .where('period_start', '>=', start)
      .first();

    if (!usage) {
      const sub = await this.db<SubscriptionRow>('subscriptions')
        .where({ user_id: userId, status: 'ACTIVE' })
        .first();
      const plan = sub ? PLAN_CONFIG[sub.plan] : null;
      const maxCount = plan ? plan.maxCount : 10;

      const [row] = await this.db<UsageRow>('usage')
        .insert({
          id: uuidv4(),
          user_id: userId,
          action_type: actionType,
          used_count: 0,
          max_count: maxCount,
          period_start: start,
          period_end: end,
        })
        .returning('*');
      usage = row;
    }
    return usage;
  }

  async createSubscription(userId: string, plan: string): Promise<Subscription> {
    const planConfig = PLAN_CONFIG[plan];
    if (!planConfig) throw new Error('Invalid plan');

    const { start, end } = getCurrentPeriod();
    const id = uuidv4();

    await this.db('subscriptions').where('user_id', userId).del();

    const [row] = await this.db<SubscriptionRow>('subscriptions')
      .insert({
        id,
        user_id: userId,
        plan,
        price: planConfig.price.toString(),
        status: 'ACTIVE',
        starts_at: start,
        ends_at: end,
      })
      .returning('*');

    await this.db('usage')
      .where({ user_id: userId, action_type: planConfig.actionType })
      .where('period_start', '>=', start)
      .update({ max_count: planConfig.maxCount });

    return toProtoSubscription(row);
  }

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.db<SubscriptionRow>('subscriptions').where('id', id).first();
    return row ? toProtoSubscription(row) : null;
  }

  async findByUser(userId: string): Promise<Subscription | null> {
    const row = await this.db<SubscriptionRow>('subscriptions')
      .where({ user_id: userId, status: 'ACTIVE' })
      .first();
    return row ? toProtoSubscription(row) : null;
  }

  async cancel(id: string): Promise<Subscription | null> {
    const [row] = await this.db<SubscriptionRow>('subscriptions')
      .where('id', id)
      .update({ status: 'CANCELLED', updated_at: new Date() } as any)
      .returning('*');
    return row ? toProtoSubscription(row) : null;
  }

  async checkUsageLimit(userId: string, actionType: string): Promise<{ allowed: boolean; usedCount: number; maxCount: number }> {
    const usage = await this.getOrCreateUsage(userId, actionType);
    const allowed = usage.max_count === -1 || usage.used_count < usage.max_count;
    return { allowed, usedCount: usage.used_count, maxCount: usage.max_count };
  }

  async incrementUsage(userId: string, actionType: string): Promise<Usage> {
    const usage = await this.getOrCreateUsage(userId, actionType);

    if (usage.max_count !== -1 && usage.used_count >= usage.max_count) {
      throw Object.assign(new Error('Usage limit reached'), { code: 'RESOURCE_EXHAUSTED' });
    }

    const [row] = await this.db<UsageRow>('usage')
      .where('id', usage.id)
      .update({ used_count: usage.used_count + 1 })
      .returning('*');
    return toProtoUsage(row);
  }

  async getUsage(userId: string, actionType: string): Promise<Usage> {
    const usage = await this.getOrCreateUsage(userId, actionType);
    return toProtoUsage(usage);
  }
}
