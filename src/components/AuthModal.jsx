import React, { useState } from 'react';

export const AuthModal = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('🇺🇿 O‘zbekiston');
  const [avatar, setAvatar] = useState('⚔️');
  const [error, setError] = useState('');

  const avatarOptions = ['⚔️', '🧙‍♂️', '🥷', '💣', '🔥', '🛡️', '👑', '⚡'];
  const countryOptions = [
    { flag: '🇺🇿', name: 'O‘zbekiston' },
    { flag: '🇺🇸', name: 'AQSh' },
    { flag: '🇬🇧', name: 'Buyuk Britaniya' },
    { flag: '🇰🇷', name: 'Janubiy Koreya' },
    { flag: '🇩🇪', name: 'Germaniya' },
    { flag: '🇯🇵', name: 'Yaponiya' },
    { flag: '🇰🇿', name: 'Qozog‘iston' },
    { flag: '🇹🇷', name: 'Turkiya' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Iltimos, foydalanuvchi nomini kiriting!');
      return;
    }

    const selectedCountryObj = countryOptions.find((c) => `${c.flag} ${c.name}` === country) || countryOptions[0];

    const userData = {
      name: username.trim(),
      avatar: avatar,
      country: selectedCountryObj.flag,
      countryName: selectedCountryObj.name,
      highScore: 0,
      totalKills: 0,
      coins: 150,
      registeredAt: new Date().toLocaleDateString(),
    };

    localStorage.setItem('zombie_game_user', JSON.stringify(userData));
    onLoginSuccess(userData);
  };

  const handleGuestLogin = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const guestData = {
      name: `Mehmon_${randomNum}`,
      avatar: '⚔️',
      country: '🇺🇿',
      countryName: 'O‘zbekiston',
      highScore: 0,
      totalKills: 0,
      coins: 100,
      registeredAt: new Date().toLocaleDateString(),
    };

    localStorage.setItem('zombie_game_user', JSON.stringify(guestData));
    onLoginSuccess(guestData);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>🧟‍♂️ PRO MAX SURVIVAL</div>
          <h1 style={styles.title}>{isRegister ? 'Ro‘yxatdan O‘tish' : 'Tizimga Kirish'}</h1>
          <p style={styles.subtitle}>
            Zombi dunyosiga qadam qo‘yish va reytingda yetakchilik qilish uchun hisobingizga kiring!
          </p>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Foydalanuvchi Nomi (Nickname):</label>
            <input
              type="text"
              placeholder="Masalan: ShadowHunter_UZ"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Parol:</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {isRegister && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Davlatingizni tanlang:</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={styles.select}
                >
                  {countryOptions.map((c) => (
                    <option key={c.name} value={`${c.flag} ${c.name}`}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Avataringizni tanlang:</label>
                <div style={styles.avatarGrid}>
                  {avatarOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAvatar(item)}
                      style={{
                        ...styles.avatarBtn,
                        borderColor: avatar === item ? '#38bdf8' : 'transparent',
                        backgroundColor: avatar === item ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="submit" style={styles.submitBtn}>
            {isRegister ? 'RO‘YXATDAN O‘TISH' : 'KIRISH'}
          </button>
        </form>

        <div style={styles.divider}>
          <span>YOKI</span>
        </div>

        <button type="button" onClick={handleGuestLogin} style={styles.guestBtn}>
          🎮 MEHMON SIFATIDA O‘YNAASH (Tezkor Kirish)
        </button>

        <div style={styles.footerToggle}>
          {isRegister ? (
            <span>
              Hisobingiz bormi?{' '}
              <button style={styles.toggleLink} onClick={() => setIsRegister(false)}>
                Kirish
              </button>
            </span>
          ) : (
            <span>
              Yangi jangchimisiz?{' '}
              <button style={styles.toggleLink} onClick={() => setIsRegister(true)}>
                Ro‘yxatdan o‘tish
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 8, 18, 0.88)',
    backdropFilter: 'blur(12px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '20px',
    padding: '32px 36px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 0 50px rgba(56, 189, 248, 0.2)',
    color: '#f8fafc',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoBadge: {
    display: 'inline-block',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  title: {
    margin: '4px 0',
    fontSize: '26px',
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '4px',
    lineHeight: '1.4',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  avatarBtn: {
    fontSize: '22px',
    padding: '8px',
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
    marginTop: '6px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '16px 0',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '700',
  },
  guestBtn: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #475569',
    color: '#e2e8f0',
    borderRadius: '10px',
    padding: '11px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  footerToggle: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '16px',
  },
  toggleLink: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
