const INITIAL_GLOBAL_LEADERBOARD = [
  { id: 1, name: 'ShadowHunter', country: '🇺🇿', countryName: 'O‘zbekiston', score: 48500, kills: 382, wave: 18, character: 'Kiber Ninja', avatar: '🥷' },
  { id: 2, name: 'Vortex_Master', country: '🇺🇸', countryName: 'AQSh', score: 42100, kills: 310, wave: 16, character: 'Sehrgar Archmage', avatar: '🧙‍♂️' },
  { id: 3, name: 'Alisher_UZB', country: '🇺🇿', countryName: 'O‘zbekiston', score: 39800, kills: 295, wave: 15, character: 'Jangchi Paladin', avatar: '⚔️' },
  { id: 4, name: 'CyberDemon99', country: '🇬🇧', countryName: 'Buyuk Britaniya', score: 36400, kills: 270, wave: 14, character: 'Og‘ir Mergan', avatar: '💣' },
  { id: 5, name: 'Toshkent_PRO', country: '🇺🇿', countryName: 'O‘zbekiston', score: 34100, kills: 250, wave: 13, character: 'Kiber Ninja', avatar: '🥷' },
  { id: 6, name: 'DragonSlayer', country: '🇰🇷', countryName: 'Janubiy Koreya', score: 31200, kills: 228, wave: 12, character: 'Jangchi Paladin', avatar: '⚔️' },
  { id: 7, name: 'Samarqand_King', country: '🇺🇿', countryName: 'O‘zbekiston', score: 28900, kills: 210, wave: 11, character: 'Sehrgar Archmage', avatar: '🧙‍♂️' },
  { id: 8, name: 'Phoenix_Rider', country: '🇩🇪', countryName: 'Germaniya', score: 26500, kills: 190, wave: 10, character: 'Og‘ir Mergan', avatar: '💣' },
  { id: 9, name: 'Fergana_Warrior', country: '🇺🇿', countryName: 'O‘zbekiston', score: 24300, kills: 175, wave: 9, character: 'Jangchi Paladin', avatar: '⚔️' },
  { id: 10, name: 'Tokyo_Ghost', country: '🇯🇵', countryName: 'Yaponiya', score: 22100, kills: 160, wave: 8, character: 'Kiber Ninja', avatar: '🥷' },
];

export const getLeaderboardData = () => {
  try {
    const saved = localStorage.getItem('zombie_game_leaderboard');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load leaderboard', e);
  }
  return INITIAL_GLOBAL_LEADERBOARD;
};

export const saveNewScore = (user, stats) => {
  const currentList = getLeaderboardData();
  const calculatedScore = (stats.kills * 25) + (stats.wave * 350) + (stats.gold * 2);

  const newEntry = {
    id: Date.now(),
    name: user.name || 'Noma\'lum Jangchi',
    country: user.country || '🇺🇿',
    countryName: user.countryName || 'O‘zbekiston',
    score: calculatedScore,
    kills: stats.kills,
    wave: stats.wave,
    character: stats.characterName || 'Jangchi Paladin',
    avatar: user.avatar || '⚔️',
  };

  const updated = [...currentList, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  try {
    localStorage.setItem('zombie_game_leaderboard', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }

  return updated;
};
