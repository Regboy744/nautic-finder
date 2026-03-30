import type { Logger } from 'pino';
import type { UsersRepository, User, NewUser } from './repositories/users.repository.js';
import type {
  SavedBoatsRepository,
  SavedBoatWithListing,
} from './repositories/saved-boats.repository.js';
import type {
  SearchAlertsRepository,
  SearchAlert,
  NewSearchAlert,
} from './repositories/search-alerts.repository.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';

export interface UserServiceDeps {
  usersRepo: UsersRepository;
  savedBoatsRepo: SavedBoatsRepository;
  alertsRepo: SearchAlertsRepository;
  log: Logger;
}

export function createUserService(deps: UserServiceDeps) {
  const { usersRepo, savedBoatsRepo, alertsRepo, log } = deps;

  return {
    // -- Profile --

    async getProfile(userId: string): Promise<User> {
      const user = await usersRepo.findById(userId);
      if (!user) throw new NotFoundError('User', userId);
      return user;
    },

    async createProfile(data: NewUser): Promise<User> {
      const existing = await usersRepo.findByEmail(data.email);
      if (existing) throw new ConflictError('User with this email already exists');
      const user = await usersRepo.create(data);
      log.info({ userId: user.id }, 'User profile created');
      return user;
    },

    async updateProfile(userId: string, data: Partial<NewUser>): Promise<User> {
      const updated = await usersRepo.update(userId, data);
      if (!updated) throw new NotFoundError('User', userId);
      return updated;
    },

    // -- Saved Boats --

    async getSavedBoats(userId: string): Promise<SavedBoatWithListing[]> {
      return savedBoatsRepo.findByUserId(userId);
    },

    async saveBoat(userId: string, listingId: string, notes?: string): Promise<{ id: string }> {
      const exists = await savedBoatsRepo.exists(userId, listingId);
      if (exists) throw new ConflictError('Boat already saved');
      const saved = await savedBoatsRepo.create({ userId, listingId, notes });
      log.info({ userId, listingId }, 'Boat saved');
      return { id: saved.id };
    },

    async removeSavedBoat(userId: string, savedBoatId: string): Promise<void> {
      const deleted = await savedBoatsRepo.delete(savedBoatId, userId);
      if (!deleted) throw new NotFoundError('Saved boat', savedBoatId);
    },

    // -- Search Alerts --

    async getAlerts(userId: string): Promise<SearchAlert[]> {
      return alertsRepo.findByUserId(userId);
    },

    async createAlert(userId: string, data: Omit<NewSearchAlert, 'userId'>): Promise<SearchAlert> {
      const alert = await alertsRepo.create({ ...data, userId });
      log.info({ userId, alertId: alert.id }, 'Search alert created');
      return alert;
    },

    async updateAlert(
      userId: string,
      alertId: string,
      data: Partial<NewSearchAlert>,
    ): Promise<SearchAlert> {
      const updated = await alertsRepo.update(alertId, userId, data);
      if (!updated) throw new NotFoundError('Search alert', alertId);
      return updated;
    },

    async deleteAlert(userId: string, alertId: string): Promise<void> {
      const deleted = await alertsRepo.delete(alertId, userId);
      if (!deleted) throw new NotFoundError('Search alert', alertId);
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;
