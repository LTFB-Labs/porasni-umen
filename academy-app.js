// @ts-check
// „Порасни умен“ inside LevAcademy: the shell loads this module in its sandboxed frame and calls mount().
// The game is the same as when it is opened alone (index.html). Here the child (name, grade) comes from the shell,
// so there is no profile screen; the progress is kept by the shell for this child (appData 'state'),
// and long streaks give badges in the child's profile.
import { defineApp } from '../core/academy-core/app.js';
import { startGame } from './game.js';

/** Badges for correct answers in a row. */
const BADGES = {
  5: { code: 'streak-5', name: 'Серия 5', icon: 'core:star', reason: 'Отговори вярно на 5 въпроса подред' },
  10: { code: 'streak-10', name: 'Серия 10', icon: 'core:medal-bronze', reason: 'Отговори вярно на 10 въпроса подред' },
  25: { code: 'streak-25', name: 'Серия 25', icon: 'core:medal-silver', reason: 'Отговори вярно на 25 въпроса подред' },
  50: { code: 'streak-50', name: 'Серия 50', icon: 'core:trophy', reason: 'Отговори вярно на 50 въпроса подред' },
};

export default defineApp({
  id: 'porasni-umen',
  name: 'Порасни умен',
  description: 'Въпроси по обща култура за твоя клас: отговаряш с думи и гониш най-дългата серия верни отговори.',
  icon: 'icon.svg',
  route: 'porasni-umen',
  grades: [1, 2, 3, 4],
  contract: 2,
  permissions: ['user', 'settings', 'storage', 'badges'],

  async mount(el, core) {
    document.documentElement.lang = 'bg';
    document.title = 'Порасни умен';
    const head = (tag, attrs) => document.head.append(Object.assign(document.createElement(tag), attrs));
    head('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' });
    head('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap' });
    head('link', { rel: 'stylesheet', href: new URL('game.css', import.meta.url).href });

    const [user, settings] = await Promise.all([core.getUser(), core.getSettings()]);
    const child = user && 'grade' in user ? user : null;
    // The game reads its state at once, so everything is loaded first and kept in memory; saves go to the shell.
    const records = child ? await core.appData.all('state') : [];
    const state = new Map(records.map((r) => [r.id, r.value]));
    const earned = new Set(child ? child.badges.filter((b) => b.app === 'porasni-umen').map((b) => b.code) : []);

    return startGame(el, {
      child: child ? { name: child.displayName, grade: child.grade } : null,
      reducedMotion: settings.reducedMotion,
      load: (key, fallback) => (state.has(key) ? state.get(key) : fallback),
      save(key, value) {
        state.set(key, value);
        if (child) core.appData.put('state', { id: key, value }).catch((error) => console.warn('Записът не стана:', error));
      },
      onStreak(streak) {
        const badge = BADGES[streak];
        if (!child || !badge || earned.has(badge.code)) return;
        earned.add(badge.code);
        core.grantUserBadge({ ...badge, description: 'Играта „Порасни умен“' })
          .catch((error) => console.warn('Значката не се даде:', error));
      },
    });
  },
});
