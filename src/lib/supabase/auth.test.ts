import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInWithEmail, signUpWithEmail, signOut, getSession, getUser } from './auth'

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
  })),
}))

describe('auth functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signInWithEmail', () => {
    it('should call signInWithPassword with correct credentials', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: {}, session: {} },
        error: null,
      })
      
      const result = await signInWithEmail('test@example.com', 'password123')
      
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should return user and session on success', async () => {
      const mockUser = { id: '123' }
      const mockSession = { access_token: 'token' }
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await signInWithEmail('test@test.com', 'pass')
      
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.session).toEqual(mockSession)
    })

    it('should return error on failure', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      const result = await signInWithEmail('test@test.com', 'wrong')
      
      expect(result.error).toEqual({ message: 'Invalid credentials' })
    })
  })

  describe('signUpWithEmail', () => {
    it('should call signUp with correct credentials', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: {} },
        error: null,
      })
      
      const result = await signUpWithEmail('new@example.com', 'password123')
      
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      })
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should return user on success', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: '456' } },
        error: null,
      })

      const result = await signUpWithEmail('new@test.com', 'pass')
      
      expect(result.data).toHaveProperty('user')
    })
  })

  describe('signOut', () => {
    it('should call signOut', async () => {
      mockSignOut.mockResolvedValueOnce({
        error: null,
      })
      
      const result = await signOut()
      
      expect(mockSignOut).toHaveBeenCalled()
      expect(result).toHaveProperty('error')
    })

    it('should return null error on success', async () => {
      mockSignOut.mockResolvedValueOnce({
        error: null,
      })

      const result = await signOut()
      
      expect(result.error).toBeNull()
    })
  })

  describe('getSession', () => {
    it('should call getSession', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })
      
      const result = await getSession()
      
      expect(mockGetSession).toHaveBeenCalled()
      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('error')
    })

    it('should return session when authenticated', async () => {
      const mockSession = { access_token: 'token', user: { id: '123' } }
      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      const result = await getSession()
      
      expect(result.session).toEqual(mockSession)
    })

    it('should return null session when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      const result = await getSession()
      
      expect(result.session).toBeNull()
    })
  })

  describe('getUser', () => {
    it('should call getUser', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })
      
      const result = await getUser()
      
      expect(mockGetUser).toHaveBeenCalled()
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('error')
    })

    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await getUser()
      
      expect(result.user).toEqual(mockUser)
    })

    it('should return null user when not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      const result = await getUser()
      
      expect(result.user).toBeNull()
    })
  })
})
