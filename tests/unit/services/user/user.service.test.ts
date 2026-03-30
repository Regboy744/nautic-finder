import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initLogger, resetLogger } from '../../../../src/shared/logger/index.js';
import { createUserService } from '../../../../src/services/user/user.service.js';

beforeEach(() => {
  resetLogger();
  initLogger({ level: 'silent', isDevelopment: false });
});

function buildMocks() {
  const usersRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const savedBoatsRepo = {
    findByUserId: vi.fn(),
    exists: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    countByUserId: vi.fn(),
  };

  const alertsRepo = {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findActive: vi.fn(),
  };

  const log = initLogger({ level: 'silent', isDevelopment: false });

  const service = createUserService({
    usersRepo: usersRepo as any,  
    savedBoatsRepo: savedBoatsRepo as any,  
    alertsRepo: alertsRepo as any,  
    log,
  });

  return { service, usersRepo, savedBoatsRepo, alertsRepo };
}

describe('UserService', () => {
  describe('getProfile', () => {
    it('returns user when found', async () => {
      const { service, usersRepo } = buildMocks();
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      usersRepo.findById.mockResolvedValue(user);

      const result = await service.getProfile('user-1');
      expect(result.id).toBe('user-1');
    });

    it('throws NotFoundError when user missing', async () => {
      const { service, usersRepo } = buildMocks();
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('createProfile', () => {
    it('creates a new user', async () => {
      const { service, usersRepo } = buildMocks();
      usersRepo.findByEmail.mockResolvedValue(null);
      const user = { id: 'user-1', email: 'test@example.com' };
      usersRepo.create.mockResolvedValue(user);

      const result = await service.createProfile({ id: 'user-1', email: 'test@example.com' });
      expect(result.email).toBe('test@example.com');
    });

    it('throws ConflictError on duplicate email', async () => {
      const { service, usersRepo } = buildMocks();
      usersRepo.findByEmail.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      await expect(
        service.createProfile({ id: 'user-2', email: 'test@example.com' }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('saveBoat', () => {
    it('saves a boat successfully', async () => {
      const { service, savedBoatsRepo } = buildMocks();
      savedBoatsRepo.exists.mockResolvedValue(false);
      savedBoatsRepo.create.mockResolvedValue({
        id: 'saved-1',
        userId: 'user-1',
        listingId: 'listing-1',
      });

      const result = await service.saveBoat('user-1', 'listing-1');
      expect(result.id).toBe('saved-1');
    });

    it('throws ConflictError if already saved', async () => {
      const { service, savedBoatsRepo } = buildMocks();
      savedBoatsRepo.exists.mockResolvedValue(true);

      await expect(service.saveBoat('user-1', 'listing-1')).rejects.toThrow('already saved');
    });
  });

  describe('createAlert', () => {
    it('creates a search alert', async () => {
      const { service, alertsRepo } = buildMocks();
      const alert = { id: 'alert-1', userId: 'user-1', name: 'Bavaria under 50k' };
      alertsRepo.create.mockResolvedValue(alert);

      const result = await service.createAlert('user-1', { name: 'Bavaria under 50k' });
      expect(result.id).toBe('alert-1');
    });
  });

  describe('deleteAlert', () => {
    it('deletes an alert', async () => {
      const { service, alertsRepo } = buildMocks();
      alertsRepo.delete.mockResolvedValue(true);

      await expect(service.deleteAlert('user-1', 'alert-1')).resolves.not.toThrow();
    });

    it('throws NotFoundError when alert missing', async () => {
      const { service, alertsRepo } = buildMocks();
      alertsRepo.delete.mockResolvedValue(false);

      await expect(service.deleteAlert('user-1', 'nonexistent')).rejects.toThrow('not found');
    });
  });
});
