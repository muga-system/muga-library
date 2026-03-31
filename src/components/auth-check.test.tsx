import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('./auth-provider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}))

import { AuthCheck } from './auth-check'

describe('AuthCheck', () => {
  it('render fallback while unauthenticated and not loading', () => {
    const fallback = <span data-testid="fallback">Fallback</span>
    const { getByTestId } = render(<AuthCheck fallback={fallback}>Children</AuthCheck>)

    expect(getByTestId('fallback')).toBeTruthy()
  })
})
