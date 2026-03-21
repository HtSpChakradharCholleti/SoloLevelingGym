import { AppState } from 'react-native';
import { createAudioPlayer } from 'expo-audio';

class SoundManager {
  constructor() {
    this.players = {};
    this.isInitialized = false;
    this.appStateSubscription = null;
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.players.tap = createAudioPlayer(require('../../assets/sounds/tap.wav'));
    } catch(e) { console.warn('Failed to load tap sound'); }
    try {
      this.players.level_up = createAudioPlayer(require('../../assets/sounds/level_up.wav'));
    } catch(e) { console.warn('Failed to load level_up sound'); }
    try {
      this.players.quest_complete = createAudioPlayer(require('../../assets/sounds/quest_complete.wav'));
    } catch(e) { console.warn('Failed to load quest_complete sound'); }
    try {
      this.players.dungeon_enter = createAudioPlayer(require('../../assets/sounds/dungeon_enter.wav'));
    } catch(e) { console.warn('Failed to load dungeon_enter sound'); }
    
    try {
      // BGM
      this.players.bgm = createAudioPlayer(require('../../assets/sounds/bgm.wav'));
      this.players.bgm.loop = true;
      this.players.bgm.play();

      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          this.players.bgm.play();
        } else {
          this.players.bgm.pause();
        }
      });

      this.isInitialized = true;
      console.log('expo-audio sounds initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sounds', error);
    }
  }

  playSound(soundName) {
    try {
      if (!this.isInitialized) {
        this.init();
      }
      const player = this.players[soundName];
      if (player) {
        player.seekTo(0); 
        player.play();
      }
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  playTap() {
    this.playSound('tap');
  }

  playLevelUp() {
    this.playSound('level_up');
  }

  playQuestComplete() {
    this.playSound('quest_complete');
  }

  playDungeonEnter() {
    this.playSound('dungeon_enter');
  }
}

export default new SoundManager();
