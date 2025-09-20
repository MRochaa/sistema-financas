import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Estado para armazenar mensagem do backend
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Testa conexão com o backend ao carregar
  useEffect(() => {
    testBackendConnection()
  }, [])

  // Função para testar conexão com o backend
  const testBackendConnection = async () => {
    try {
      // Usa a URL relativa para funcionar com o proxy do Nginx
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setMessage('✅ Backend conectado com sucesso!')
        console.log('Resposta do backend:', data)
      } else {
        setMessage('⚠️ Backend respondeu com erro')
      }
    } catch (error) {
      console.error('Erro ao conectar com backend:', error)
      setMessage('❌ Erro ao conectar com o backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Sistema de Finanças Familiares</h1>
        <p>Controle suas finanças de forma simples e eficiente</p>
      </header>

      <main className="app-main">
        {/* Status da conexão com o backend */}
        <div className="status-card">
          <h2>Status do Sistema</h2>
          {loading ? (
            <p>🔄 Verificando conexão...</p>
          ) : (
            <p>{message}</p>
          )}
        </div>

        {/* Área para futuras funcionalidades */}
        <div className="features-grid">
          <div className="feature-card">
            <h3>📊 Dashboard</h3>
            <p>Visualize seus gastos e receitas</p>
          </div>
          
          <div className="feature-card">
            <h3>➕ Lançamentos</h3>
            <p>Registre suas transações</p>
          </div>
          
          <div className="feature-card">
            <h3>📈 Relatórios</h3>
            <p>Análises detalhadas</p>
          </div>
          
          <div className="feature-card">
            <h3>⚙️ Configurações</h3>
            <p>Personalize o sistema</p>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 Sistema de Finanças - Todos os direitos reservados</p>
      </footer>
    </div>
  )
}

export default App
