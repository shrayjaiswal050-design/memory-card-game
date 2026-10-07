class MemoryGame {
    constructor() {
        this.CARD_FLIP_DURATION = 600;
        this.CARD_MISMATCH_DURATION = 1000;
        this.CARD_FLIP_SOUND_FREQUENCY = 800;
        this.CARD_FLIP_SOUND_VOLUME = 0.15;
        this.MATCH_SOUND_FREQUENCY = 600;
        this.MATCH_SOUND_VOLUME = 0.25;
        this.CLICK_SOUND_FREQUENCY = 1000;
        this.CLICK_SOUND_VOLUME = 0.1;
        this.SOUND_DURATION = 0.1;
        this.CONFETTI_COUNT = 50;
        this.CONFETTI_ANIMATION_DELAY = 50;
        this.CONFETTI_FALL_TIME_MIN = 2;
        this.CONFETTI_FALL_TIME_MAX = 5;
        this.CONFETTI_FONT_SIZE_MIN = 20;
        this.CONFETTI_FONT_SIZE_MAX = 40;
        this.CONFETTI_LIFESPAN = 5000;
        this.TIMER_INTERVAL = 1000;
        this.CHEER_DELAY_STEP = 0.15;
        this.CHEER_NOTE_SUSTAIN = 0.3;
        this.CHEER_CHIME_START = 0.6;
        this.CHEER_CHIME_END = 0.9;
        
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isProcessing = false;
        this.difficulty = 'easy';
        this.gameStarted = false;
        this.isNewHighScore = false;
        this.theme = 'fruits';
        this.isMuted = false;
        this.audioContext = null;
        this.soundsInitialized = false;
        
        this.sounds = {
            flip: () => this.initAndPlaySound(this.CARD_FLIP_SOUND_FREQUENCY, this.CARD_FLIP_SOUND_VOLUME, 'sine'),
            match: () => this.initAndPlaySound(this.MATCH_SOUND_FREQUENCY, this.MATCH_SOUND_VOLUME, 'triangle'),
            victory: this.createCheerSound(),
            click: () => this.initAndPlaySound(this.CLICK_SOUND_FREQUENCY, this.CLICK_SOUND_VOLUME, 'square')
        };
        
        this.themes = {
            fruits: {
                easy: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'],
                medium: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🥝', '🍑'],
                hard: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🥝', '🍑', '🍒', '🥭', '🍍', '🥥']
            },
            animals: {
                easy: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
                medium: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐨'],
                hard: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐨', '🐯', '🦝', '🦘', '🦡']
            },
            sports: {
                easy: ['⚽', '🏀', '🎾', '⚾', '🏐', '🎱'],
                medium: ['⚽', '🏀', '🎾', '⚾', '🏐', '🎱', '🏈', '🎯'],
                hard: ['⚽', '🏀', '🎾', '⚾', '🏐', '🎱', '🏈', '🎯', '🏹', '🎳', '🥊', '🥋']
            },
            transport: {
                easy: ['🚗', '🚕', '🚙', '🏎', '🚓', '🚔'],
                medium: ['🚗', '🚕', '🚙', '🏎', '🚓', '🚔', '🚂', '🚐'],
                hard: ['🚗', '🚕', '🚙', '🏎', '🚓', '🚔', '🚂', '🚐', '🚜', '🚛', '🚚', '🏍']
            },
            food: {
                easy: ['🍕', '🍔', '🌮', '🍟', '🍿', '🥪'],
                medium: ['🍕', '🍔', '🌮', '🍟', '🍿', '🥪', '🍗', '🥙'],
                hard: ['🍕', '🍔', '🌮', '🍟', '🍿', '🥪', '🍗', '🥙', '🍝', '🌯', '🥘', '🍛']
            }
        };
        
        this.addConfettiStyles();
        this.initializeGame();
        this.attachEventListeners();
    }
    
    initAndPlaySound(frequency, volume, type = 'sine') {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator(type);
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            gainNode.gain.value = volume;
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + this.SOUND_DURATION);
        } catch (error) {
            return;
        }
    }
    
    createCheerSound() {
        return () => {
            try {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                const now = this.audioContext.currentTime;
                const cheerNotes = [523, 659, 784, 1047];
                
                cheerNotes.forEach((frequency, noteIndex) => {
                    const oscillator = this.audioContext.createOscillator('sine');
                    const gain = this.audioContext.createGain();
                    
                    oscillator.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    const noteStartTime = now + (noteIndex * this.CHEER_DELAY_STEP);
                    oscillator.frequency.setValueAtTime(frequency, noteStartTime);
                    gain.gain.setValueAtTime(0.2, noteStartTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, noteStartTime + this.CHEER_NOTE_SUSTAIN);
                    
                    oscillator.start(noteStartTime);
                    oscillator.stop(noteStartTime + this.CHEER_NOTE_SUSTAIN);
                });
                
                const chime = this.audioContext.createOscillator('sine');
                const chimeGain = this.audioContext.createGain();
                
                chime.connect(chimeGain);
                chimeGain.connect(this.audioContext.destination);
                
                chime.frequency.setValueAtTime(1319, now + this.CHEER_CHIME_START);
                chimeGain.gain.setValueAtTime(0.15, now + this.CHEER_CHIME_START);
                chimeGain.gain.exponentialRampToValueAtTime(0.01, now + this.CHEER_CHIME_END);
                
                chime.start(now + this.CHEER_CHIME_START);
                chime.stop(now + this.CHEER_CHIME_END);
            } catch (error) {
                return;
            }
        };
    }
    
    playSound(soundType) {
        if (this.isMuted) return;
        try {
            if (this.sounds[soundType]) {
                this.sounds[soundType]();
            }
        } catch (error) {
            return;
        }
    }
    
    initializeGame() {
        this.showIntro();
    }
    
    showIntro() {
        document.body.classList.add('intro-active');
        document.getElementById('intro-page').style.display = 'flex';
    }
    
    hideIntro() {
        document.body.classList.remove('intro-active');
        document.getElementById('intro-page').style.display = 'none';
    }
    
    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.createBoard();
            this.resetGame();
        });
        document.getElementById('play-again').addEventListener('click', () => {
            this.hideMessage();
            this.createBoard();
            this.resetGame();
        });
        document.getElementById('difficulty').addEventListener('change', (event) => {
            this.difficulty = event.target.value;
            this.createBoard();
            this.resetGame();
            this.loadBestScore();
        });
        document.getElementById('theme').addEventListener('change', (event) => {
            this.theme = event.target.value;
            this.createBoard();
            this.resetGame();
        });
        
        document.getElementById('stats-btn').addEventListener('click', () => {
            this.showStats();
        });
        document.getElementById('close-stats').addEventListener('click', () => {
            this.hideStats();
        });
        document.getElementById('reset-stats').addEventListener('click', () => {
            this.playSound('click');
            this.resetStats();
        });
        
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                this.isMuted = !this.isMuted;
                muteBtn.textContent = this.isMuted ? '🔇 Sound' : '🔊 Sound';
            });
        }

        document.getElementById('start-game').addEventListener('click', () => {
            this.hideIntro();
            this.createBoard();
            this.resetGame();
            this.loadBestScore();
        });
    }
    
    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.className = `game-board ${this.difficulty}`;
        
        const emojiSet = this.themes[this.theme][this.difficulty];
        this.cards = [...emojiSet, ...emojiSet];
        this.shuffleCards();
        
        this.cards.forEach((emoji, index) => {
            const card = this.createCard(emoji, index);
            gameBoard.appendChild(card);
        });
    }
    
    createCard(emoji, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-face card-front">?</div>
            <div class="card-face card-back">${emoji}</div>
        `;
        
        card.addEventListener('click', () => this.flipCard(card));
        return card;
    }
    
    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    flipCard(card) {
        if (this.isProcessing || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        if (!this.gameStarted) {
            this.startTimer();
            this.gameStarted = true;
        }
        
        this.playSound('flip');
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.checkMatch();
        }
    }
    
    checkMatch() {
        this.isProcessing = true;
        this.moves++;
        this.updateMoves();
        
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.emoji === card2.dataset.emoji;
        
        if (match) {
            this.handleMatch();
        } else {
            this.handleMismatch();
        }
    }
    
    handleMatch() {
        const [card1, card2] = this.flippedCards;
        
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.playSound('match');
            this.matchedPairs++;
            this.flippedCards = [];
            this.isProcessing = false;
            
            const totalCardsInDifficulty = this.themes[this.theme][this.difficulty].length;
            if (this.matchedPairs === totalCardsInDifficulty) {
                this.endGame();
            }
        }, this.CARD_FLIP_DURATION);
    }
    
    handleMismatch() {
        setTimeout(() => {
            this.flippedCards.forEach(card => card.classList.remove('flipped'));
            this.flippedCards = [];
            this.isProcessing = false;
        }, this.CARD_MISMATCH_DURATION);
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, this.TIMER_INTERVAL);
    }
    
    stopTimer() {
        clearInterval(this.timerInterval);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateMoves() {
        document.getElementById('moves').textContent = this.moves;
    }
    
    resetGame() {
        this.stopTimer();
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isProcessing = false;
        this.gameStarted = false;
        
        this.updateTimer();
        this.updateMoves();
        this.hideMessage();
    }
    
    endGame() {
        this.stopTimer();
        this.saveBestScore();
        
        this.updateStatistics(true, this.moves, this.timer);
        
        this.playSound('victory');
        
        this.showMessage();
    }
    
    showMessage() {
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-time').textContent = document.getElementById('timer').textContent;
        document.getElementById('game-message').classList.add('show');
        this.createConfetti();
    }
    
    hideMessage() {
        document.getElementById('game-message').classList.remove('show');
    }
    
    createConfetti() {
        const container = document.body;
        
        for (let i = 0; i < this.CONFETTI_COUNT; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                const randomFontSize = Math.random() * (this.CONFETTI_FONT_SIZE_MAX - this.CONFETTI_FONT_SIZE_MIN) + this.CONFETTI_FONT_SIZE_MIN;
                const randomFallTime = Math.random() * (this.CONFETTI_FALL_TIME_MAX - this.CONFETTI_FALL_TIME_MIN) + this.CONFETTI_FALL_TIME_MIN;
                const randomRotation = Math.random() * 360;
                
                confetti.textContent = '🎉';
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-50px';
                confetti.style.fontSize = randomFontSize + 'px';
                confetti.style.zIndex = '9999';
                confetti.style.pointerEvents = 'none';
                confetti.style.animation = `fall ${randomFallTime}s linear forwards`;
                confetti.style.transform = `rotate(${randomRotation}deg)`;
                
                container.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, this.CONFETTI_LIFESPAN);
            }, i * this.CONFETTI_ANIMATION_DELAY);
        }
    }
    
    addConfettiStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    saveBestScore() {
        const scoreKey = `memoryGame_best_${this.theme}_${this.difficulty}`;
        const timeKey = `memoryGame_bestTime_${this.theme}_${this.difficulty}`;
        const currentBest = localStorage.getItem(scoreKey);
        const currentBestTime = localStorage.getItem(timeKey);

        let movesBeatBest = false;
        let timeBeatBest = false;

        if (!currentBest || this.moves <= parseInt(currentBest)) {
            movesBeatBest = true;
        }
        if (!currentBestTime || this.timer < parseInt(currentBestTime)) {
            timeBeatBest = true;
        }

        if (movesBeatBest) {
            localStorage.setItem(scoreKey, this.moves);
        }
        if (timeBeatBest) {
        localStorage.setItem(timeKey, this.timer);
        }

        this.isNewHighScore = movesBeatBest || timeBeatBest;
        this.loadBestScore();
    }
    
    loadBestScore() {
        const scoreKey = `memoryGame_best_${this.theme}_${this.difficulty}`;
        const timeKey = `memoryGame_bestTime_${this.theme}_${this.difficulty}`;
        const bestMoves = localStorage.getItem(scoreKey);
        const bestTime = localStorage.getItem(timeKey);

        if (bestMoves && bestTime) {
            const minutes = Math.floor(bestTime / 60);
            const seconds = bestTime % 60;
            const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('best-score').textContent = `${bestMoves} moves / ${timeText}`;
        } else {
            document.getElementById('best-score').textContent = '-- moves / --:--';
        }

        this.updateStatsDisplay();
    }
    
    showStats() {
        document.getElementById('stats-modal').style.display = 'block';
        this.updateStatsDisplay();
    }
    
    hideStats() {
        document.getElementById('stats-modal').style.display = 'none';
    }
    
    updateStatsDisplay() {
        const stats = this.getStatistics();
        
        document.getElementById('total-games').textContent = stats.totalGames;
        document.getElementById('games-won').textContent = stats.gamesWon;
        document.getElementById('win-rate').textContent = `${stats.winRate}%`;
        document.getElementById('avg-moves').textContent = stats.avgMoves.toFixed(1);
        document.getElementById('best-time-ever').textContent = stats.bestTimeEver;
        document.getElementById('current-streak').textContent = stats.currentStreak;
    }
    
    getStatistics() {
        const stats = JSON.parse(localStorage.getItem('memoryGame_stats') || '{}');
        
        return {
            totalGames: stats.totalGames || 0,
            gamesWon: stats.gamesWon || 0,
            winRate: stats.totalGames ? Math.round((stats.gamesWon / stats.totalGames) * 100) : 0,
            avgMoves: stats.avgMoves || 0,
            bestTimeEver: stats.bestTimeEver || '--:--',
            currentStreak: stats.currentStreak || 0
        };
    }
    
    updateStatistics(won, moves, time) {
        const stats = this.getStatistics();
        
        stats.totalGames++;
        if (won) {
            stats.gamesWon++;
            stats.currentStreak++;
        } else {
            stats.currentStreak = 0;
        }
        
        // Update average moves
        stats.avgMoves = ((stats.avgMoves * (stats.totalGames - 1)) + moves) / stats.totalGames;
        
        // Update best time ever
        if (stats.bestTimeEver === '--:--' || time < this.timeToSeconds(stats.bestTimeEver)) {
            stats.bestTimeEver = this.secondsToTime(time);
        }
        
        localStorage.setItem('memoryGame_stats', JSON.stringify(stats));
    }
    
    resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone!')) {
            localStorage.removeItem('memoryGame_stats');
            this.updateStatsDisplay();
        }
    }
    
    timeToSeconds(timeStr) {
        if (timeStr === '--:--') return Infinity;
        const [minutes, seconds] = timeStr.split(':').map(Number);
        return minutes * 60 + seconds;
    }
    
    secondsToTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
