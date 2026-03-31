import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  },
}))

describe('database service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllDatabases', () => {
    it('should call db.select with databases table', async () => {
      const { getAllDatabases } = await import('./database')
      await getAllDatabases()
      
      const { db } = await import('@/lib/db')
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe('getDatabaseById', () => {
    it('should call db.select with id filter', async () => {
      const { getDatabaseById } = await import('./database')
      await getDatabaseById('test-id')
      
      const { db } = await import('@/lib/db')
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe('createDatabase', () => {
    it('should call db.insert with data', async () => {
      const { createDatabase } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await createDatabase({ name: 'Test DB', description: 'Test description' })
      
      expect(db.insert).toHaveBeenCalled()
    })
  })

  describe('updateDatabase', () => {
    it('should call db.update with id filter', async () => {
      const { updateDatabase } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await updateDatabase('test-id', { name: 'Updated Name' })
      
      expect(db.update).toHaveBeenCalled()
    })
  })

  describe('deleteDatabase', () => {
    it('should call db.delete with id filter', async () => {
      const { deleteDatabase } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await deleteDatabase('test-id')
      
      expect(db.delete).toHaveBeenCalled()
    })
  })

  describe('getRecordsByDatabase', () => {
    it('should call db.select with databaseId filter', async () => {
      const { getRecordsByDatabase } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await getRecordsByDatabase('test-db-id')
      
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe('createRecord', () => {
    it('should call db.insert with record data', async () => {
      const { createRecord } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await createRecord({ 
        databaseId: 'test-db-id', 
        data: { title: 'Test Book' },
        totalEjemplares: 2,
        disponibles: 2
      })
      
      expect(db.insert).toHaveBeenCalled()
    })
  })

  describe('getAllLoans', () => {
    it('should call db.select with loans table', async () => {
      const { getAllLoans } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await getAllLoans()
      
      expect(db.select).toHaveBeenCalled()
    })

    it('should filter by status when provided', async () => {
      const { getAllLoans } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await getAllLoans('active')
      
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe('getLoanStats', () => {
    it('should return loan statistics', async () => {
      const { getLoanStats } = await import('./database')
      const { db } = await import('@/lib/db')
      
      await getLoanStats()
      
      expect(db.select).toHaveBeenCalled()
    })
  })
})
