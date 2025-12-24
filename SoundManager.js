/**
 * Sound Manager - Handles all game audio
 */
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isEnabled = true;
    this.masterVolume = 0.5;
    
    // Engine audio nodes
    this.engineNodes = {
      oscillator: null,
      gainNode: null,
      filter: null,
      isPlaying: false
    };
    
    // Initialize audio context on first user interaction
    this.initAudioContext();
    
    console.log('🔊 Sound manager initialized');
  }
  
  initAudioContext() {
    // Create audio context on first user interaction (required by browsers)
    const startAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.loadSounds();
        console.log('🎵 Audio context started');
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    document.addEventListener('touchstart', startAudio);
  }
  
  loadSounds() {
    // Create sound effects using Web Audio API
    // These are procedurally generated sounds
    
    // Brake sound (short burst of noise)
    this.createBrakeSound();
    
    // Collision sound (impact)
    this.createCollisionSound();
    
    // Horn sound
    this.createHornSound();
  }
  
  createBrakeSound() {
    // Create a buffer for brake sound (tire screech simulation)
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate noise with envelope for screech effect
    for (let i = 0; i < buffer.length; i++) {
      const envelope = Math.exp(-i / (sampleRate * 0.3)); // Decay envelope
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }
    
    this.sounds.brake = buffer;
  }
  
  createCollisionSound() {
    // Create a buffer for collision sound (impact)
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate noise burst with quick decay
    for (let i = 0; i < buffer.length; i++) {
      const envelope = Math.exp(-i / (sampleRate * 0.1)); // Fast decay
      data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }
    
    this.sounds.collision = buffer;
  }
  
  createHornSound() {
    // Create a buffer for horn sound
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    const frequency = 440; // A4 note
    
    // Generate sine wave with envelope
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, Math.exp(-t * 5)); // Decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }
    
    this.sounds.horn = buffer;
  }
  
  startEngine() {
    if (!this.audioContext || !this.isEnabled || this.engineNodes.isPlaying) return;
    
    // Create oscillator for engine sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Setup engine sound (low rumble)
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 80; // Base engine frequency
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    
    gainNode.gain.value = 0.15 * this.masterVolume;
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Start oscillator
    oscillator.start();
    
    // Store references
    this.engineNodes = {
      oscillator,
      gainNode,
      filter,
      isPlaying: true
    };
    
    console.log('🚗 Engine started');
  }
  
  stopEngine() {
    if (!this.engineNodes.isPlaying) return;
    
    // Fade out
    if (this.engineNodes.gainNode) {
      this.engineNodes.gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.5
      );
    }
    
    // Stop oscillator after fade
    if (this.engineNodes.oscillator) {
      setTimeout(() => {
        if (this.engineNodes.oscillator) {
          this.engineNodes.oscillator.stop();
        }
      }, 500);
    }
    
    this.engineNodes.isPlaying = false;
    console.log('🛑 Engine stopped');
  }
  
  updateEngine(speed, maxSpeed, isAccelerating) {
    if (!this.engineNodes.isPlaying || !this.audioContext) return;
    
    // Calculate engine RPM based on speed
    const speedRatio = Math.abs(speed) / maxSpeed;
    const baseFrequency = 80;
    const maxFrequency = 300;
    const targetFrequency = baseFrequency + (maxFrequency - baseFrequency) * speedRatio;
    
    // Smooth frequency transition
    if (this.engineNodes.oscillator) {
      this.engineNodes.oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, targetFrequency),
        this.audioContext.currentTime + 0.1
      );
    }
    
    // Adjust volume based on acceleration
    const targetVolume = isAccelerating ? 0.2 : 0.12;
    if (this.engineNodes.gainNode) {
      this.engineNodes.gainNode.gain.exponentialRampToValueAtTime(
        targetVolume * this.masterVolume,
        this.audioContext.currentTime + 0.1
      );
    }
    
    // Adjust filter frequency for more realistic sound
    const filterFreq = 400 + speedRatio * 1200;
    if (this.engineNodes.filter) {
      this.engineNodes.filter.frequency.exponentialRampToValueAtTime(
        Math.max(100, filterFreq),
        this.audioContext.currentTime + 0.1
      );
    }
  }
  
  playBrake(intensity = 1.0) {
    if (!this.audioContext || !this.isEnabled || !this.sounds.brake) return;
    
    // Only play if braking hard enough
    if (intensity < 0.3) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    source.buffer = this.sounds.brake;
    
    // Highpass filter for tire screech
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    gainNode.gain.value = Math.min(1, intensity * 0.4) * this.masterVolume;
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start();
  }
  
  playCollision(intensity = 1.0) {
    if (!this.audioContext || !this.isEnabled || !this.sounds.collision) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = this.sounds.collision;
    gainNode.gain.value = Math.min(1, intensity * 0.6) * this.masterVolume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start();
    
    console.log('💥 Collision sound played');
  }
  
  playHorn() {
    if (!this.audioContext || !this.isEnabled || !this.sounds.horn) return;
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = this.sounds.horn;
    gainNode.gain.value = 0.3 * this.masterVolume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start();
    
    console.log('📯 Horn played');
  }
  
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update engine volume if playing
    if (this.engineNodes.gainNode) {
      this.engineNodes.gainNode.gain.value = 0.15 * this.masterVolume;
    }
  }
  
  toggleMute() {
    this.isEnabled = !this.isEnabled;
    
    if (!this.isEnabled && this.engineNodes.isPlaying) {
      this.engineNodes.gainNode.gain.value = 0;
    } else if (this.isEnabled && this.engineNodes.isPlaying) {
      this.engineNodes.gainNode.gain.value = 0.15 * this.masterVolume;
    }
    
    console.log(`🔊 Sound ${this.isEnabled ? 'enabled' : 'muted'}`);
    return this.isEnabled;
  }
  
  destroy() {
    this.stopEngine();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
