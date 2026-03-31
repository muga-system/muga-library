import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import IniciarSesionPage from './page'

vi.mock('@/lib/supabase/auth', () => ({
  signInWithEmail: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('IniciarSesionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the login form', () => {
    render(<IniciarSesionPage />)
    
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('should show demo credentials', () => {
    render(<IniciarSesionPage />)
    
    expect(screen.getByText(/admin@muga.com/)).toBeInTheDocument()
  })

  it('should update email input', async () => {
    render(<IniciarSesionPage />)
    
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    await userEvent.type(emailInput, 'test@example.com')
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should update password input', async () => {
    render(<IniciarSesionPage />)
    
    const passwordInput = screen.getByLabelText(/contraseña/i)
    await userEvent.type(passwordInput, 'password123')
    
    expect(passwordInput).toHaveValue('password123')
  })

  it('should show error message on failed login', async () => {
    const { signInWithEmail } = await import('@/lib/supabase/auth')
    ;(signInWithEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    })

    render(<IniciarSesionPage />)
    
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    const { signInWithEmail } = await import('@/lib/supabase/auth')
    ;(signInWithEmail as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100))
    )

    render(<IniciarSesionPage />)
    
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(screen.getByText(/ingresando/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled()
  })

  it('should show error when no session returned', async () => {
    const { signInWithEmail } = await import('@/lib/supabase/auth')
    ;(signInWithEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    render(<IniciarSesionPage />)
    
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Error al iniciar sesión')).toBeInTheDocument()
    })
  })
})
