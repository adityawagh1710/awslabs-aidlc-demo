import type { User } from '@prisma/client'
import type { UserRepository } from '../repositories/user.repository'

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findById(id)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email)
  }

  async create(input: { email: string; passwordHash: string }): Promise<User> {
    return this.userRepo.create(input)
  }
}
