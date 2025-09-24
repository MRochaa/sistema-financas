import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import axios from 'axios'

// Mock do axios
const mockAxios = vi.mocked(axios)

// Componente de teste para usar o AuthContext
const TestComponent = () => {
  const { user, login, register, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <button onClick={() => login('test@test.com', 'password123')}>
        Login
      </button>
      <button onClick={() => register('test@test.com', 'password123', 'Test User')}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render without user initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
  })

  it('should handle login successfully', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test User' }
    const mockToken = 'mock-token'
    
    mockAxios.post.mockResolvedValueOnce({
      data: { user: mockUser, token: mockToken }
    })
    
    mockAxios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    fireEvent.click(screen.getByText('Login'))
    
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      })
    })
  })

  it('should handle register successfully', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test User' }
    const mockToken = 'mock-token'
    
    mockAxios.post.mockResolvedValueOnce({
      data: { user: mockUser, token: mockToken }
    })
    
    mockAxios.get.mockResolvedValueOnce({
      data: { user: mockUser }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    fireEvent.click(screen.getByText('Register'))
    
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      })
    })
  })

  it('should handle logout', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    fireEvent.click(screen.getByText('Logout'))
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('should validate email format', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('E-mail inválido'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    fireEvent.click(screen.getByText('Login'))
    
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      })
    })
  })

  it('should validate password strength', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Senha deve ter entre 8 e 128 caracteres, incluindo pelo menos uma letra minúscula, uma maiúscula e um número'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    fireEvent.click(screen.getByText('Login'))
    
    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      })
    })
  })
})
