// =========================================
// 1. ESTADO GLOBAL Y CONFIGURACIÓN
// =========================================
let gameState = {
    score: 0,
    streak: 0,
    highScore: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    guessedIds: [], // Nombres de Pokémon ya acertados
    lastSeenId: 0   // Controla el número de la Pokédex
};

let currentMode = { order: 'random', visual: 'silhouette' };
let currentPokemon = null;

// NUEVO: El "candado" para evitar que se pulse Intro durante las animaciones
let isAnimating = false; 

// =========================================
// 2. REFERENCIAS AL DOM
// =========================================
const UI = {
    menuScreen: document.getElementById('menuScreen'),
    gameScreen: document.getElementById('gameScreen'),
    galleryScreen: document.getElementById('galleryScreen'),
    
    score: document.getElementById('scoreDisplay'),
    streak: document.getElementById('streakDisplay'),
    highScore: document.getElementById('highScoreDisplay'),
    accuracy: document.getElementById('accuracyDisplay'),
    
    image: document.getElementById('pokemonImage'),
    input: document.getElementById('guessInput'),
    suggestions: document.getElementById('suggestionsBox'),
    
    checkBtn: document.getElementById('checkBtn'),
    skipBtn: document.getElementById('skipBtn'),
    prevBtn: document.getElementById('prevBtn'), 
    resetBtn: document.getElementById('resetBtn'),
    feedback: document.getElementById('feedbackMessage'),
    card: document.querySelector('.game-card'),
    galleryGrid: document.getElementById('galleryGrid'),
    caughtCount: document.getElementById('caughtCount')
};

// =========================================
// 3. INICIALIZACIÓN Y EVENTOS
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    loadProgress(); 

    UI.checkBtn.addEventListener('click', handleGuess);
    UI.skipBtn.addEventListener('click', handleSkip);
    UI.prevBtn.addEventListener('click', handlePrevious);
    UI.resetBtn.addEventListener('click', resetProgress);
    
    // Lógica "Enter Inteligente"
    UI.input.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault(); 
            if (isAnimating) return; // Si hay animación, ignoramos el Enter por completo
            
            if (UI.suggestions.style.display === 'block' && UI.suggestions.firstChild) {
                UI.input.value = UI.suggestions.firstChild.textContent;
                closeSuggestions();
            }
            handleGuess(); 
        }
    });
    
    UI.input.addEventListener('input', handleAutocomplete);
    
    document.addEventListener('click', (e) => {
        if (!UI.input.contains(e.target) && !UI.suggestions.contains(e.target)) {
            closeSuggestions();
        }
    });
});

// =========================================
// 4. GESTIÓN DE PANTALLAS
// =========================================
function hideAllScreens() {
    UI.menuScreen.classList.remove('active');
    UI.gameScreen.classList.remove('active');
    UI.galleryScreen.classList.remove('active');
}

function showMenu() { 
    hideAllScreens(); 
    UI.menuScreen.classList.add('active'); 
}

function showGallery() { 
    hideAllScreens(); 
    renderGallery(); 
    UI.galleryScreen.classList.add('active'); 
}

function startGame(order, visual) {
    currentMode.order = order;
    currentMode.visual = visual;
    hideAllScreens();
    UI.gameScreen.classList.add('active');
    startNewRound('next');
}

// =========================================
// 5. LÓGICA PRINCIPAL DEL JUEGO
// =========================================
function startNewRound(direction = 'next') {
    // Abrimos el candado y habilitamos el input al empezar ronda
    isAnimating = false;
    UI.input.disabled = false;
    
    UI.input.value = '';
    UI.input.focus();
    UI.feedback.textContent = '';
    UI.feedback.className = 'feedback-message';
    closeSuggestions();
    
    UI.image.className = currentMode.visual === 'silhouette' ? 'silhouette' : '';

    let availablePokemon = pokemonList.filter(p => !gameState.guessedIds.includes(p.name));
    
    if (availablePokemon.length === 0) {
        alert("¡Felicidades Maestro Pokémon! Has completado la Pokédex.");
        gameState.guessedIds = [];
        gameState.lastSeenId = 0;
        availablePokemon = pokemonList;
        saveProgress();
    }

    if (currentMode.order === 'random') {
        UI.prevBtn.style.display = 'none';
        const randomIndex = Math.floor(Math.random() * availablePokemon.length);
        currentPokemon = availablePokemon[randomIndex];
    } else {
        UI.prevBtn.style.display = 'block';
        
        if (direction === 'next') {
            let nextPokes = availablePokemon.filter(p => p.id > gameState.lastSeenId);
            if (nextPokes.length === 0) {
                gameState.lastSeenId = 0; 
                nextPokes = availablePokemon;
            }
            currentPokemon = nextPokes[0];
        } else if (direction === 'prev') {
            if (!currentPokemon) {
                currentPokemon = availablePokemon[0];
            } else {
                let prevPokes = availablePokemon.filter(p => p.id < currentPokemon.id);
                if (prevPokes.length > 0) {
                    currentPokemon = prevPokes[prevPokes.length - 1];
                }
            }
        }
        gameState.lastSeenId = currentPokemon.id; 

        let hasPrev = availablePokemon.some(p => p.id < currentPokemon.id);
        if (!hasPrev) {
            UI.prevBtn.disabled = true;
            UI.prevBtn.style.opacity = '0.5';
            UI.prevBtn.style.cursor = 'not-allowed';
        } else {
            UI.prevBtn.disabled = false;
            UI.prevBtn.style.opacity = '1';
            UI.prevBtn.style.cursor = 'pointer';
        }
    }

    UI.image.src = `front/${currentPokemon.name}.png`;
    UI.image.onerror = () => { UI.image.alt = `Falta imagen: front/${currentPokemon.name}.png`; };
}

function handleGuess() {
    if (isAnimating) return; // Evita el glitch de doble Enter
    
    const userGuess = UI.input.value.trim().toUpperCase();
    if (!userGuess) return;

    gameState.totalAttempts++;
    const distance = getLevenshteinDistance(userGuess, currentPokemon.name);

    if (distance <= 1) handleCorrectGuess();
    else handleWrongGuess();
}

function handleCorrectGuess() {
    // Bloqueamos el juego mientras dura la animación
    isAnimating = true;
    UI.input.disabled = true;
    
    gameState.score += 10;
    gameState.streak++;
    gameState.correctAttempts++;
    if (gameState.streak > gameState.highScore) gameState.highScore = gameState.streak;
    gameState.guessedIds.push(currentPokemon.name);
    
    saveProgress(); 
    updateUI();

    UI.image.className = 'revealed'; 
    UI.card.classList.add('pulse-green');
    UI.feedback.textContent = `¡Correcto! Es ${currentPokemon.name}`;
    UI.feedback.className = 'feedback-message text-success';
    
    setTimeout(() => { 
        UI.card.classList.remove('pulse-green'); 
        startNewRound('next'); 
    }, 1500);
}

function handleWrongGuess() {
    // Bloqueamos el juego brevemente durante el temblor rojo
    isAnimating = true;
    UI.input.disabled = true;
    
    gameState.streak = 0; 
    saveProgress(); 
    updateUI();
    
    UI.card.classList.add('shake-red');
    UI.feedback.textContent = '¡Fallaste! Inténtalo de nuevo.';
    UI.feedback.className = 'feedback-message text-error';
    
    setTimeout(() => { 
        UI.card.classList.remove('shake-red'); 
        isAnimating = false;
        UI.input.disabled = false;
        UI.input.value = ''; 
        UI.input.focus();
    }, 400);
}

function handleSkip() {
    if (isAnimating) return;
    
    isAnimating = true;
    UI.input.disabled = true;
    
    gameState.totalAttempts++; 
    gameState.streak = 0; 
    saveProgress(); 
    updateUI();
    
    UI.image.className = 'revealed';
    UI.feedback.textContent = `Era... ${currentPokemon.name}`;
    UI.feedback.className = 'feedback-message text-error';
    
    setTimeout(() => { startNewRound('next'); }, 1500);
}

function handlePrevious() {
    if (isAnimating || UI.prevBtn.disabled) return;
    startNewRound('prev');
}

// =========================================
// 6. AUTOCOMPLETADO
// =========================================
function handleAutocomplete() {
    if (isAnimating) return;
    
    const value = UI.input.value.trim().toUpperCase();
    UI.suggestions.innerHTML = ''; 
    
    if (!value) { closeSuggestions(); return; }

    const matches = pokemonList.filter(p => p.name.startsWith(value) && !gameState.guessedIds.includes(p.name));
    
    if (matches.length === 0) { closeSuggestions(); return; }

    matches.slice(0, 5).forEach(p => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = p.name;
        
        div.addEventListener('click', () => {
            if (isAnimating) return; // Protegemos el click también
            UI.input.value = p.name; 
            closeSuggestions();      
            handleGuess();         
        });
        UI.suggestions.appendChild(div);
    });
    
    UI.suggestions.style.display = 'block';
}

function closeSuggestions() { 
    UI.suggestions.style.display = 'none'; 
}

// =========================================
// 7. GALERÍA POKÉDEX
// =========================================
function renderGallery() {
    UI.caughtCount.textContent = gameState.guessedIds.length;
    UI.galleryGrid.innerHTML = ''; 

    pokemonList.forEach(p => {
        const isCaught = gameState.guessedIds.includes(p.name);
        const item = document.createElement('div');
        item.className = `gallery-item ${isCaught ? 'caught' : ''}`;
        
        const img = document.createElement('img');
        img.src = `front/${p.name}.png`;
        img.alt = p.name;
        img.onerror = () => { img.style.display = 'none'; }; 
        
        const nameLabel = document.createElement('span');
        nameLabel.textContent = isCaught ? p.name : `#${p.id}`;

        item.appendChild(img); 
        item.appendChild(nameLabel); 
        UI.galleryGrid.appendChild(item);
    });
}

// =========================================
// 8. UTILIDADES
// =========================================
function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

function saveProgress() { 
    localStorage.setItem('pokeGameState', JSON.stringify(gameState)); 
}

function loadProgress() { 
    const savedState = localStorage.getItem('pokeGameState'); 
    if (savedState) gameState = { ...gameState, ...JSON.parse(savedState) }; 
    updateUI(); 
}

function resetProgress() {
    if (confirm('¿Estás seguro de que quieres borrar todo tu progreso? Tu Pokédex volverá a 0.')) {
        localStorage.removeItem('pokeGameState');
        gameState = { score: 0, streak: 0, highScore: 0, totalAttempts: 0, correctAttempts: 0, guessedIds: [], lastSeenId: 0 };
        updateUI(); 
        showMenu();
    }
}

function updateUI() {
    UI.score.textContent = gameState.score; 
    UI.streak.textContent = gameState.streak; 
    UI.highScore.textContent = gameState.highScore;
    
    let percent = 0; 
    if (gameState.totalAttempts > 0) percent = Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100);
    UI.accuracy.textContent = `${percent}%`;
}