import React, { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { GameCanvas } from './game/components/GameCanvas.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('auth'); // auth | dashboard | game
  const [activeGameConfig, setActiveGameConfig] = useState(null);

  // Load saved user on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('zombie_game_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('auth');
      }
    } catch (e) {
      setCurrentScreen('auth');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('zombie_game_user');
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleStartGame = (gameConfig) => {
    setActiveGameConfig(gameConfig);
    setCurrentScreen('game');
  };

  const handleReturnToDashboard = () => {
    // Reload user from storage to pick up new score/coins
    try {
      const savedUser = localStorage.getItem('zombie_game_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {}

    setCurrentScreen('dashboard');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#090d16', margin: 0, padding: 0 }}>
      {currentScreen === 'auth' && <AuthModal onLoginSuccess={handleLoginSuccess} />}

      {currentScreen === 'dashboard' && user && (
        <Dashboard
          user={user}
          onStartGame={handleStartGame}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'game' && user && activeGameConfig && (
        <GameCanvas
          user={user}
          gameConfig={activeGameConfig}
          onReturnToDashboard={handleReturnToDashboard}
        />
      )}
    </div>
  );
}

export default App;
