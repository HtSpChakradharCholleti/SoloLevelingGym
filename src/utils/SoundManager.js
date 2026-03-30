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
      this.players.timer_tick = createAudioPlayer(require('../../assets/sounds/timer_tick.wav'));
    } catch(e) { console.warn('Failed to load timer_tick sound'); }
    try {
      this.players.timer_complete = createAudioPlayer(require('../../assets/sounds/timer_complete.wav'));
    } catch(e) { console.warn('Failed to load timer_complete sound'); }
    
    try {
      // BGM
      this.players.bgm = createAudioPlayer(require('../../assets/sounds/bgm.wav'));
      this.players.bgm.loop = true;
      this.players.bgm.play();

      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          if (this.bgmEnabled) {
            this.players.bgm.play();
          }
        } else {
          this.players.bgm.pause();
        }
      });

      this.isInitialized = true;
      this.bgmEnabled = true;
      console.log('expo-audio sounds initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sounds', error);
    }
  }

  pauseBGM() {
    try {
      if (this.players.bgm) {
        this.players.bgm.pause();
      }
      this.bgmEnabled = false;
    } catch (e) {
      console.error('Error pausing BGM', e);
    }
  }

  resumeBGM() {
    try {
      if (this.players.bgm) {
        this.players.bgm.play();
      }
      this.bgmEnabled = true;
    } catch (e) {
      console.error('Error resuming BGM', e);
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

  playTimerTick() {
    this.playSound('timer_tick');
  }

  playTimerComplete() {
    this.playSound('timer_complete');
  }

  playTimerCompleteLoop() {
    try {
      if (!this.isInitialized) {
        this.init();
      }
      const player = this.players.timer_complete;
      if (player) {
        player.loop = true;
        player.seekTo(0);
        player.play();
      }
    } catch (e) {
      console.error('Error looping timer_complete', e);
    }
  }

  stopTimerComplete() {
    try {
      const player = this.players.timer_complete;
      if (player) {
        player.loop = false;
        player.pause();
        player.seekTo(0);
      }
    } catch (e) {
      console.error('Error stopping timer_complete', e);
    }
  }
}

export default new SoundManager();
