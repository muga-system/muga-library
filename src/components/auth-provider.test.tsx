import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './auth-provider'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

const mockSession = {
  access_token: 'token-123',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'refresh-123',
  user: mockUser,
}

const mockSignOut = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: mockSignOut,
    },
  })),
}))

function TestComponent() {
  const { user, session, loading, signOut } = useAuth()
  
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{user ? user.email : 'no-user'}</span>
      <span data-testid="session">{session ? 'has-session' : 'no-session'}</span>
      <button onClick={signOut} data-testid="signout">Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should provide null user when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('session')).toHaveTextContent('no-session')
  })

  it('should provide user when session exists', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signOut: mockSignOut,
      },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('should call signOut when signOut is triggered', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    await userEvent.click(screen.getByTestId('signout'))

    expect(mockSignOut).toHaveBeenCalled()
  })
})
