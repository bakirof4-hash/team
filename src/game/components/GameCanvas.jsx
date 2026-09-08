import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine.js';

export const GameCanvas = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

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
  const [gameOverStats, setGameOverStats] = useState(null);
  const [waveBanner, setWaveBanner] = useState(null);

  // Resize canvas handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    engineRef.current.resize(width, height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setGameState(state);
    };

    engine.onGameOver = (stats) => {
      setIsGameOver(true);
      setGameOverStats(stats);
      engine.pause();
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
  }, [handleResize]);

  const handleRestart = () => {
    setIsGameOver(false);
    setGameOverStats(null);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (gameState.hp / gameState.maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (gameState.xp / gameState.maxXp) * 100));

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Top Left: Player Status Bar */}
      <div style={styles.topLeftHud}>
        <div style={styles.hudCard}>
          {/* Level Badge & HP */}
          <div style={styles.hpRow}>
            <div style={styles.levelBadge}>Lv.{gameState.level}</div>
            <div style={styles.barContainer}>
              <div style={styles.barHeader}>
                <span style={styles.barLabel}>HP</span>
                <span style={styles.barValue}>{gameState.hp} / {gameState.maxHp}</span>
              </div>
              <div style={styles.barBg}>
                <div style={{ ...styles.hpFill, width: `${hpPercent}%` }} />
              </div>
            </div>
          </div>

          {/* XP Bar */}
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
                {gameState.boss.phase === 2 ? 'PHASE 2 (ENRAGED)' : 'PHASE 1'}
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

      {/* Top Right: Wave, Gold, Kills Counter */}
      <div style={styles.topRightHud}>
        <div style={styles.hudStatsCard}>
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
        </div>
      </div>

      {/* Bottom Center: Ability & Controls Overlay */}
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
            <span>WASD / Arrows: Move</span>
            <span>•</span>
            <span>LMB: Attack</span>
            <span>•</span>
            <span>Mouse: Aim</span>
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
                ? `⚠️ WAVE ${waveBanner.wave}: BOSS BATTLE ⚠️`
                : `⚔️ WAVE ${waveBanner.wave} ⚔️`}
            </h2>
            {waveBanner.unlockedTypes && (
              <p style={styles.waveBannerSub}>
                Enemies: {waveBanner.unlockedTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && gameOverStats && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h1 style={styles.gameOverTitle}>YOU DIED</h1>
            <p style={styles.gameOverSubtitle}>The abyss claimed your soul.</p>

            <div style={styles.statsSummary}>
              <div style={styles.summaryRow}>
                <span>Wave Reached:</span>
                <strong>Wave {gameOverStats.wave}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Enemies Slain:</span>
                <strong>{gameOverStats.kills}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Gold Collected:</span>
                <strong style={{ color: '#facc15' }}>{gameOverStats.gold}g</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Hero Level:</span>
                <strong style={{ color: '#38bdf8' }}>Level {gameOverStats.level}</strong>
              </div>
            </div>

            <button style={styles.restartButton} onClick={handleRestart}>
              PLAY AGAIN
            </button>
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    width: '260px',
  },
  hpRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  levelBadge: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '13px',
    padding: '4px 8px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.4)',
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
    pointerEvents: 'none',
  },
  hudStatsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(51, 65, 85, 0.6)',
    borderRadius: '12px',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
    width: '64px',
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
    animation: 'fadeIn 0.3s ease-in-out',
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
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(6px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    border: '2px solid #ef4444',
    borderRadius: '16px',
    padding: '32px 40px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)',
    maxWidth: '400px',
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
    margin: '8px 0 24px 0',
    color: '#94a3b8',
    fontSize: '14px',
  },
  statsSummary: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
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
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '1px',
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.5)',
    transition: 'all 0.2s ease',
  },
};
