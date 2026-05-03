import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "join_the_game": "Join the Game!",
      "go_to": "Go to",
      "game_pin": "Game PIN",
      "start_game": "Start Game",
      "waiting_for_players": "Waiting for players...",
      "who_is_imposter": "Who is the Imposter?",
      "look_at_devices": "Look at your devices!",
      "end_round": "End Round",
      "leaderboard": "Leaderboard",
      "next_game": "Next Game",
      "play_now": "Play Now!",
      "enter": "Enter",
      "who_are_you": "Who are you?",
      "nickname": "Nickname",
      "im_ready": "I'm Ready!",
      "youre_in": "You're in!",
      "look_at_tv": "Look at the TV...",
      "select_imposter": "Select the Imposter!",
      "category": "Category",
      "secret_word": "Secret Word",
      "you_are_imposter": "You are the Imposter!",
      "shhh": "Shhh! Don't let anyone know.",
      "ask_a_question": "ask a question!",
      "to": "to",
      "time_to_vote": "Time to vote!",
      "vote_on_devices": "Vote on your devices now",
      "imposter_was": "The Imposter was",
      "imposter_wins": "The Imposter tricked everyone!",
      "players_win": "The players caught the Imposter!"
    }
  },
  ar: {
    translation: {
      "join_the_game": "انضم إلى اللعبة!",
      "go_to": "اذهب إلى",
      "game_pin": "رمز اللعبة",
      "start_game": "ابدأ اللعبة",
      "waiting_for_players": "في انتظار اللاعبين...",
      "who_is_imposter": "من هو المحتال؟",
      "look_at_devices": "انظر إلى جهازك!",
      "end_round": "إنهاء الجولة",
      "leaderboard": "لوحة الصدارة",
      "next_game": "اللعبة التالية",
      "play_now": "العب الآن!",
      "enter": "دخول",
      "who_are_you": "من أنت؟",
      "nickname": "الاسم المستعار",
      "im_ready": "أنا مستعد!",
      "youre_in": "لقد دخلت!",
      "look_at_tv": "انظر إلى التلفاز...",
      "select_imposter": "اختر المحتال!",
      "category": "الفئة",
      "secret_word": "الكلمة السرية",
      "you_are_imposter": "أنت هو المحتال!",
      "shhh": "صه! لا تدع أحداً يعرف.",
      "ask_a_question": "اطرح سؤالاً!",
      "to": "على",
      "time_to_vote": "حان وقت التصويت!",
      "vote_on_devices": "صوّت من جهازك الآن",
      "imposter_was": "المحتال كان",
      "imposter_wins": "المحتال خدع الجميع!",
      "players_win": "اكتشف اللاعبون المحتال!"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
