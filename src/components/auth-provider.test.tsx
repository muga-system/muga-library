import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AuthProvider, useAuth } from "./auth-provider"

const { mockGetCurrentUser, mockSignOut } = vi.hoisted(() => ({ mockGetCurrentUser: vi.fn(), mockSignOut: vi.fn().mockResolvedValue({ error: null }) }))
vi.mock("@/lib/auth/client", () => ({ getCurrentUser: mockGetCurrentUser, signOut: mockSignOut }))

function TestComponent() {
  const { user, session, loading, signOut } = useAuth()
  return <div><span data-testid="loading">{loading.toString()}</span><span data-testid="user">{user?.email || "no-user"}</span><span data-testid="session">{session ? "has-session" : "no-session"}</span><button onClick={signOut} data-testid="signout">Sign Out</button></div>
}

describe("AuthProvider", () => {
  beforeEach(() => { vi.clearAllMocks(); mockGetCurrentUser.mockResolvedValue({ user: null, error: null }) })

  it("loads without a user", async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"))
    expect(screen.getByTestId("user")).toHaveTextContent("no-user")
  })

  it("provides the current user", async () => {
    mockGetCurrentUser.mockResolvedValue({ user: { id: "u1", email: "test@example.com", app_metadata: { role: "admin" }, user_metadata: { role: "admin" } }, error: null })
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("test@example.com"))
    expect(screen.getByTestId("session")).toHaveTextContent("has-session")
  })

  it("signs out through the local auth client", async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"))
    await userEvent.click(screen.getByTestId("signout"))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
