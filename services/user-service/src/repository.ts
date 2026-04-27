import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';
import type {
  User,
  CreateUserRequest,
  ListUsersRequest,
  UpdateUserRequest,
} from '../../../shared/proto-types/user';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_id: string | null;
  skills: string[];
  resume_url: string | null;
  created_at: Date;
  updated_at: Date;
}

function toProtoUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    phone: row.phone ?? '',
    avatarUrl: row.avatar_url ?? '',
    bio: row.bio ?? '',
    companyId: row.company_id ?? '',
    skills: row.skills ?? [],
    resumeUrl: row.resume_url ?? '',
    createdAt: row.created_at?.toISOString() ?? '',
    updatedAt: row.updated_at?.toISOString() ?? '',
  };
}

export class UserRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateUserRequest): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = uuidv4();
    const [row] = await this.db<UserRow>('users')
      .insert({
        id,
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        role: data.role,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        company_id: data.companyId || null,
        skills: data.skills ?? [],
      })
      .returning('*');
    return toProtoUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db<UserRow>('users').where('id', id).first();
    return row ? toProtoUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db<UserRow>('users').where('email', email).first();
    return row ? toProtoUser(row) : null;
  }

  async list(params: ListUsersRequest): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, role } = params;
    const offset = (page - 1) * limit;

    let query = this.db<UserRow>('users');
    if (role) query = query.where('role', role);

    const [{ count }] = await query.clone().count();
    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return { users: rows.map(toProtoUser), total: parseInt(count as string, 10) };
  }

  async update(params: UpdateUserRequest): Promise<User | null> {
    const { id, name, phone, avatarUrl, bio, companyId, skills, resumeUrl } = params;
    const updates: Record<string, unknown> = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    if (bio) updates.bio = bio;
    if (companyId) updates.company_id = companyId;
    if (skills && skills.length) updates.skills = skills;
    if (resumeUrl) updates.resume_url = resumeUrl;
    updates.updated_at = new Date();

    const [row] = await this.db<UserRow>('users').where('id', id).update(updates).returning('*');
    return row ? toProtoUser(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db('users').where('id', id).del();
    return deleted > 0;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User } | null> {
    const row = await this.db<UserRow>('users').where('email', email).first();
    if (!row) return null;

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) return null;

    const token = jwt.sign(
      { userId: row.id, role: row.role },
      config.jwtSecret,
      { expiresIn: '24h' },
    );
    return { token, user: toProtoUser(row) };
  }
}
