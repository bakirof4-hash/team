import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine.js';
import { sounds } from '../engine/SoundSystem.js';
import { saveNewScore } from '../../data/leaderboardData.js';

export const GameCanvas = ({ user, gameConfig, onReturnToDashboard }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const character = gameConfig?.character || { name: 'Jangchi Paladin', icon: '⚔️', color: '#38bdf8' };
  const difficulty = gameConfig?.difficulty || { name: 'O‘rtacha', icon: '🟡', color: '#eab308' };

  const [gameState, setGameState] = useState({
    hp: 120,
    maxHp: 120,
    xp: 0,
    maxXp: 100,
    level: 1,
    gold: 0,
    kills: 0,
    wave: 1,
    dashCooldown: 0,
    specialCooldown: 0,
    enemiesAlive: 0,
    boss: null,
  });

  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [waveBanner, setWaveBanner] = useState(null);

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    engineRef.current.resize(width, height);
  }, []);

  // Listen for Pause (P or ESC) keypresses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (!isGameOver) {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas, gameConfig?.character, gameConfig?.difficulty);
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setGameState(state);
    };

    engine.onGameOver = (stats) => {
      setIsGameOver(true);
      const fullStats = {
        ...stats,
        characterName: character.name,
      };
      setGameOverStats(fullStats);
      engine.pause();

      if (user) {
        saveNewScore(user, fullStats);
      }
    };

    engine.onWaveBanner = (bannerData) => {
      setWaveBanner(bannerData);
      setTimeout(() => {
        setWaveBanner(null);
      }, 3500);
    };

    engine.start();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [handleResize, gameConfig, user]);

  const togglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    setIsGameOver(false);
    setGameOverStats(null);
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (gameState.hp / gameState.maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (gameState.xp / gameState.maxXp) * 100));

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Top Left: Hero Avatar & HP/XP Bars */}
      <div style={styles.topLeftHud}>
        <div style={styles.hudCard}>
          <div style={styles.hpRow}>
            <div style={{ ...styles.heroAvatarBadge, backgroundColor: character.color || '#2563eb' }}>
              {character.icon} Lv.{gameState.level}
            </div>
            <div style={styles.barContainer}>
              <div style={styles.barHeader}>
                <span style={styles.barLabel}>HP ({character.name})</span>
                <span style={styles.barValue}>{gameState.hp} / {gameState.maxHp}</span>
              </div>
              <div style={styles.barBg}>
                <div style={{ ...styles.hpFill, width: `${hpPercent}%` }} />
              </div>
            </div>
          </div>

          <div style={styles.xpRow}>
            <div style={styles.barHeader}>
              <span style={styles.xpLabel}>EXP</span>
              <span style={styles.barValue}>{gameState.xp} / {gameState.maxXp}</span>
            </div>
            <div style={styles.barBg}>
              <div style={{ ...styles.xpFill, width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Center: Boss Health Bar (if active) */}
      {gameState.boss && (
        <div style={styles.bossHud}>
          <div style={styles.bossCard}>
            <div style={styles.bossHeader}>
              <span style={styles.bossName}>{gameState.boss.name}</span>
              <span style={styles.bossPhaseBadge}>
                {gameState.boss.phase === 2 ? 'FAZA 2 (QAZABLI)' : 'FAZA 1'}
              </span>
            </div>
            <div style={styles.bossBarBg}>
              <div
                style={{
                  ...styles.bossBarFill,
                  width: `${Math.max(0, Math.min(100, (gameState.boss.hp / gameState.boss.maxHp) * 100))}%`,
                  backgroundColor: gameState.boss.phase === 2 ? '#ef4444' : '#dc2626',
                }}
              />
            </div>
            <div style={styles.bossHpText}>
              {gameState.boss.hp} / {gameState.boss.maxHp}
            </div>
          </div>
        </div>
      )}

      {/* Top Right: Stats & Pause Button */}
      <div style={styles.topRightHud}>
        <div style={styles.hudStatsCard}>
          <div style={styles.statItem}>
            <span style={{ color: difficulty.color, fontWeight: 'bold', fontSize: '12px' }}>
              {difficulty.icon} {difficulty.name}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>⚔️</span>
            <span style={styles.statText}>Wave {gameState.wave}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💰</span>
            <span style={styles.goldText}>{gameState.gold}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💀</span>
            <span style={styles.statText}>{gameState.kills} Kills</span>
          </div>
          <button style={styles.pauseHudBtn} onClick={togglePause} title="Pausa (P / ESC)">
            ⏸️
          </button>
        </div>
      </div>

      {/* Bottom Center: Abilities Bar */}
      <div style={styles.bottomCenterHud}>
        <div style={styles.abilityBar}>
          <div style={styles.abilitySlot}>
            <div style={styles.abilityKey}>SPACE</div>
            <div style={styles.abilityName}>Dash</div>
            {gameState.dashCooldown > 0 && (
              <div style={styles.cooldownOverlay}>
                {gameState.dashCooldown.toFixed(1)}s
              </div>
            )}
          </div>

          <div style={styles.abilitySlot}>
            <div style={styles.abilityKey}>E / RMB</div>
            <div style={styles.abilityName}>Nova Slash</div>
            {gameState.specialCooldown > 0 && (
              <div style={styles.cooldownOverlay}>
                {gameState.specialCooldown.toFixed(1)}s
              </div>
            )}
          </div>

          <div style={styles.controlsInfo}>
            <span>WASD: Move</span>
            <span>•</span>
            <span>LMB: Attack</span>
            <span>•</span>
            <span>P / ESC: Pause</span>
          </div>
        </div>
      </div>

      {/* Wave Announcement Banner */}
      {waveBanner && (
        <div style={styles.waveBannerContainer}>
          <div style={styles.waveBannerContent}>
            <h2 style={styles.waveBannerTitle}>
              {waveBanner.bannerText
                ? waveBanner.bannerText
                : waveBanner.isBossWave
                ? `⚠️ WAVE ${waveBanner.wave}: MALAKOR BOSS BATTLE ⚠️`
                : `⚔️ WAVE ${waveBanner.wave} ⚔️`}
            </h2>
            {waveBanner.unlockedTypes && (
              <p style={styles.waveBannerSub}>
                Zombilar: {waveBanner.unlockedTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && !isGameOver && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h1 style={{ color: '#38bdf8', margin: '0 0 8px 0', fontSize: '28px' }}>PAUSA</h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
              O‘yin vaqtincha to‘xtatildi. Tayyor bo‘lganda davom eting.
            </p>

            <div style={styles.pauseMenuButtons}>
              <button style={styles.resumeBtn} onClick={togglePause}>
                ▶️ O‘YINNI DAVOM ETTIRISH
              </button>
              <button style={styles.soundBtn} onClick={handleToggleSound}>
                {isMuted ? '🔇 OVOZNI YOQISH' : '🔊 OVOZNI O‘CHIRISH'}
              </button>
              <button style={styles.homeBtn} onClick={onReturnToDashboard}>
                🏠 DASHBOARDGA QAYTISH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && gameOverStats && (
        <div style={styles.modalBackdrop}>
          <div style={styles.gameOverCard}>
            <h1 style={styles.gameOverTitle}>YOU DIED</h1>
            <p style={styles.gameOverSubtitle}>Zombilar to‘dasi sizni mahv etdi!</p>

            <div style={styles.statsSummary}>
              <div style={styles.summaryRow}>
                <span>Qahramon:</span>
                <strong style={{ color: character.color }}>{character.icon} {character.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Qiyinlik:</span>
                <strong style={{ color: difficulty.color }}>{difficulty.icon} {difficulty.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Yetilgan Wave:</span>
                <strong>Wave {gameOverStats.wave}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>O‘ldirilgan Zombilar:</span>
                <strong style={{ color: '#fca5a5' }}>💀 {gameOverStats.kills}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Yig‘ilgan Gold:</span>
                <strong style={{ color: '#facc15' }}>💰 {gameOverStats.gold}g</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Umumiy Reyting Balli:</span>
                <strong style={{ color: '#4ade80', fontSize: '16px' }}>
                  🏆 {((gameOverStats.kills * 25) + (gameOverStats.wave * 350) + (gameOverStats.gold * 2)).toLocaleString()} pts
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={styles.restartButton} onClick={handleRestart}>
                🔄 YANA O‘YNAASH
              </button>
              <button style={styles.returnBtn} onClick={onReturnToDashboard}>
                🏠 DASHBOARDGA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#090d16',
    userSelect: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  topLeftHud: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 10,
    pointerEvents: 'none',
  },
  hudCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    width: '270px',
  },
  hpRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  heroAvatarBadge: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  barContainer: {
    flex: 1,
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '3px',
  },
  barLabel: {
    color: '#ef4444',
  },
  barValue: {
    color: '#cbd5e1',
  },
  barBg: {
    width: '100%',
    height: '9px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: '4px',
    transition: 'width 0.15s ease-out',
  },
  xpRow: {
    marginTop: '4px',
  },
  xpLabel: {
    color: '#38bdf8',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: '4px',
    transition: 'width 0.15s ease-out',
  },
  bossHud: {
    position: 'absolute',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    pointerEvents: 'none',
    width: '420px',
    maxWidth: '90vw',
  },
  bossCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(220, 38, 38, 0.6)',
    borderRadius: '10px',
    padding: '10px 16px',
    boxShadow: '0 0 25px rgba(220, 38, 38, 0.4)',
  },
  bossHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  bossName: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
  bossPhaseBadge: {
    color: '#fef08a',
    backgroundColor: 'rgba(185, 28, 28, 0.6)',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  bossBarBg: {
    width: '100%',
    height: '12px',
    backgroundColor: 'rgba(69, 10, 10, 0.8)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  bossBarFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.1s ease-out',
  },
  bossHpText: {
    color: '#fca5a5',
    fontSize: '10px',
    textAlign: 'center',
    marginTop: '4px',
    fontWeight: '600',
  },
  topRightHud: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10,
  },
  hudStatsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statIcon: {
    fontSize: '14px',
  },
  statText: {
    color: '#f1f5f9',
    fontWeight: '600',
    fontSize: '13px',
  },
  goldText: {
    color: '#facc15',
    fontWeight: '700',
    fontSize: '14px',
  },
  pauseHudBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  bottomCenterHud: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  abilityBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '14px',
    padding: '8px 16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
  },
  abilitySlot: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '68px',
    height: '52px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '8px',
    border: '1px solid rgba(71, 85, 105, 0.6)',
  },
  abilityKey: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#93c5fd',
  },
  abilityName: {
    fontSize: '11px',
    color: '#e2e8f0',
    marginTop: '2px',
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  controlsInfo: {
    display: 'flex',
    gap: '8px',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: '500',
    marginLeft: '8px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(51, 65, 85, 0.6)',
  },
  waveBannerContainer: {
    position: 'absolute',
    top: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    pointerEvents: 'none',
  },
  waveBannerContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(10px)',
    border: '2px solid #38bdf8',
    borderRadius: '12px',
    padding: '16px 32px',
    textAlign: 'center',
    boxShadow: '0 0 35px rgba(56, 189, 248, 0.4)',
  },
  waveBannerTitle: {
    margin: 0,
    fontSize: '22px',
    color: '#ffffff',
    letterSpacing: '1px',
    fontWeight: '800',
  },
  waveBannerSub: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(5, 8, 18, 0.88)',
    backdropFilter: 'blur(8px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #38bdf8',
    borderRadius: '16px',
    padding: '32px 40px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(56, 189, 248, 0.3)',
    maxWidth: '380px',
    width: '90%',
  },
  pauseMenuButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resumeBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  soundBtn: {
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  homeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '10px',
    padding: '12px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  gameOverCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #ef4444',
    borderRadius: '16px',
    padding: '32px 40px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)',
    maxWidth: '420px',
    width: '90%',
  },
  gameOverTitle: {
    margin: 0,
    color: '#ef4444',
    fontSize: '36px',
    fontWeight: '900',
    letterSpacing: '2px',
  },
  gameOverSubtitle: {
    margin: '8px 0 20px 0',
    color: '#94a3b8',
    fontSize: '14px',
  },
  statsSummary: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    color: '#cbd5e1',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  restartButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  returnBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
