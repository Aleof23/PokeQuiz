// ==========================================================================
// 1. ESTADO GLOBAL Y CONFIGURACIÓN BASE
// ==========================================================================
let gameState = {
    score: 0,
    streak: 0,
    highScore: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    guessedIds: [], // Guarda los nombres de los Pokémon ya acertados
    lastSeenId: 0   // Controla por qué número vamos en el Modo Pokédex
};

let currentMode = { id: 'random', visual: 'silhouette' }; // Modos: random, pokedex, timeattack
let currentPokemon = null;
let isAnimating = false; // "Candado" para evitar el spam de clicks o la tecla Enter

// ==========================================================================
// 2. VARIABLES DEL MODO CONTRARRELOJ
// ==========================================================================
let taTimer = null;
let taSeconds = 0;
let taRound = 1;
let taPool = []; // Guardará los 15 Pokémon a adivinar

// ==========================================================================
// 3. VARIABLES Y BASE DE DATOS DEL MODO MAESTRO DE TIPOS
// ==========================================================================
let tmScore = 0;
let tmStreak = 0;
let currentAttackType = '';
let currentDefendType = '';

const TYPES_LIST = [
    'NORMAL', 'FUEGO', 'AGUA', 'ELECTRICO', 'PLANTA', 'HIELO', 'LUCHA', 
    'VENENO', 'TIERRA', 'VOLADOR', 'PSIQUICO', 'BICHO', 'ROCA', 'FANTASMA', 
    'DRAGON', 'SINIESTRO', 'ACERO', 'HADA'
];

// Matriz de efectividad (Si un ataque contra una defensa no está aquí, es x1 Neutro)
const TYPE_CHART = {
    NORMAL:   { ROCA: 0.5, FANTASMA: 0, ACERO: 0.5 },
    FUEGO:    { FUEGO: 0.5, AGUA: 0.5, PLANTA: 2, HIELO: 2, BICHO: 2, ROCA: 0.5, DRAGON: 0.5, ACERO: 2 },
    AGUA:     { FUEGO: 2, AGUA: 0.5, PLANTA: 0.5, TIERRA: 2, ROCA: 2, DRAGON: 0.5 },
    ELECTRICO:{ AGUA: 2, ELECTRICO: 0.5, PLANTA: 0.5, TIERRA: 0, VOLADOR: 2, DRAGON: 0.5 },
    PLANTA:   { FUEGO: 0.5, AGUA: 0.5, PLANTA: 0.5, VENENO: 0.5, TIERRA: 2, VOLADOR: 0.5, BICHO: 0.5, ROCA: 2, DRAGON: 0.5, ACERO: 0.5, AGUA: 2 },
    HIELO:    { FUEGO: 0.5, AGUA: 0.5, PLANTA: 2, HIELO: 0.5, TIERRA: 2, VOLADOR: 2, DRAGON: 2, ACERO: 0.5 },
    LUCHA:    { NORMAL: 2, HIELO: 2, VENENO: 0.5, VOLADOR: 0.5, PSIQUICO: 0.5, BICHO: 0.5, ROCA: 2, FANTASMA: 0, SINIESTRO: 2, ACERO: 2, HADA: 0.5 },
    VENENO:   { PLANTA: 2, VENENO: 0.5, TIERRA: 0.5, ROCA: 0.5, FANTASMA: 0.5, ACERO: 0, HADA: 2 },
    TIERRA:   { FUEGO: 2, ELECTRICO: 2, PLANTA: 0.5, VENENO: 2, VOLADOR: 0, BICHO: 0.5, ROCA: 2, ACERO: 2 },
    VOLADOR:  { ELECTRICO: 0.5, PLANTA: 2, LUCHA: 2, BICHO: 2, ROCA: 0.5, ACERO: 0.5 },
    PSIQUICO: { LUCHA: 2, VENENO: 2, PSIQUICO: 0.5, SINIESTRO: 0, ACERO: 0.5 },
    BICHO:    { FUEGO: 0.5, PLANTA: 2, LUCHA: 0.5, VENENO: 0.5, VOLADOR: 0.5, PSIQUICO: 2, FANTASMA: 0.5, SINIESTRO: 2, ACERO: 0.5, HADA: 0.5 },
    ROCA:     { FUEGO: 2, HIELO: 2, LUCHA: 0.5, TIERRA: 0.5, VOLADOR: 2, BICHO: 2, ACERO: 0.5 },
    FANTASMA: { NORMAL: 0, PSIQUICO: 2, FANTASMA: 2, SINIESTRO: 0.5 },
    DRAGON:   { DRAGON: 2, ACERO: 0.5, HADA: 0 },
    SINIESTRO:{ LUCHA: 0.5, PSIQUICO: 2, FANTASMA: 2, SINIESTRO: 0.5, HADA: 0.5 },
    ACERO:    { FUEGO: 0.5, AGUA: 0.5, ELECTRICO: 0.5, HIELO: 2, ROCA: 2, ACERO: 0.5, HADA: 2 },
    HADA:     { FUEGO: 0.5, LUCHA: 2, VENENO: 0.5, DRAGON: 2, SINIESTRO: 2, ACERO: 0.5 }
};

// ==========================================================================
// 4. REFERENCIAS A LOS ELEMENTOS DEL DOM
// ==========================================================================
const UI = {
    // Pantallas
    menuScreen: document.getElementById('menuScreen'),
    gameScreen: document.getElementById('gameScreen'),
    typeScreen: document.getElementById('typeScreen'),
    galleryScreen: document.getElementById('galleryScreen'),
    
    // Paneles de Juego
    classicStats: document.getElementById('classicStats'),
    timeAttackPanel: document.getElementById('timeAttackPanel'),
    timerDisplay: document.getElementById('timerDisplay'),
    progressDisplay: document.getElementById('progressDisplay'),
    
    // Estadísticas Clásicas
    score: document.getElementById('scoreDisplay'),
    streak: document.getElementById('streakDisplay'),
    highScore: document.getElementById('highScoreDisplay'),
    accuracy: document.getElementById('accuracyDisplay'),
    
    // Elementos de Adivinanza
    image: document.getElementById('pokemonImage'),
    input: document.getElementById('guessInput'),
    suggestions: document.getElementById('suggestionsBox'),
    
    // Botones de Interacción
    checkBtn: document.getElementById('checkBtn'),
    skipBtn: document.getElementById('skipBtn'),
    prevBtn: document.getElementById('prevBtn'), 
    resetBtn: document.getElementById('resetBtn'),
    feedback: document.getElementById('feedbackMessage'),
    card: document.querySelector('#gameScreen .game-card'),
    
    // Elementos del Maestro de Tipos
    typeScore: document.getElementById('typeScoreDisplay'),
    typeStreak: document.getElementById('typeStreakDisplay'),
    attackType: document.getElementById('attackType'),
    defendType: document.getElementById('defendType'),
    typeFeedback: document.getElementById('typeFeedbackMessage'),
    typeCard: document.querySelector('.type-master-card'),
    
    // Galería
    galleryGrid: document.getElementById('galleryGrid'),
    caughtCount: document.getElementById('caughtCount')
};

// ==========================================================================
// 5. INICIALIZACIÓN Y EVENTOS GENERALES
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProgress(); 

    // Botones del juego principal
    UI.checkBtn.addEventListener('click', handleGuess);
    UI.skipBtn.addEventListener('click', handleSkip);
    UI.prevBtn.addEventListener('click', handlePrevious);
    UI.resetBtn.addEventListener('click', resetProgress);
    
    // "Enter Inteligente" con Candado Anti-Spam
    UI.input.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault(); 
            if (isAnimating) return; // Bloquea el Enter durante las animaciones
            
            // Si la caja de autocompletado tiene opciones, seleccionamos la primera
            if (UI.suggestions.style.display === 'block' && UI.suggestions.firstChild) {
                UI.input.value = UI.suggestions.firstChild.textContent;
                closeSuggestions();
            }
            handleGuess(); 
        }
    });
    
    UI.input.addEventListener('input', handleAutocomplete);
    
    // Ocultar autocompletado al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!UI.input.contains(e.target) && !UI.suggestions.contains(e.target)) {
            closeSuggestions();
        }
    });
});

// ==========================================================================
// 6. GESTIÓN DE PANTALLAS Y MENÚS
// ==========================================================================
function hideAllScreens() {
    UI.menuScreen.classList.remove('active');
    UI.gameScreen.classList.remove('active');
    UI.typeScreen.classList.remove('active');
    UI.galleryScreen.classList.remove('active');
    
    // Detenemos el cronómetro si el usuario se sale a mitad de partida
    clearInterval(taTimer);
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

// Inicia Modos Clásicos (Aleatorio o Pokédex)
function startGame(order, visual) {
    currentMode = { id: order, visual: visual };
    hideAllScreens();
    
    // Configura la interfaz clásica
    UI.timeAttackPanel.style.display = 'none';
    UI.classicStats.style.display = 'flex';
    
    UI.gameScreen.classList.add('active');
    startNewRound('next');
}

// Inicia el Modo Contrarreloj
function startTimeAttack() {
    currentMode = { id: 'timeattack', visual: 'color' };
    hideAllScreens();
    
    // Configura la interfaz contrarreloj
    UI.classicStats.style.display = 'none';
    UI.timeAttackPanel.style.display = 'flex';
    UI.prevBtn.style.display = 'none'; // No se puede volver atrás en contrarreloj
    
    // Crear una piscina de 15 Pokémon únicos al azar
    taPool = [];
    let tempArray = [...pokemonList];
    for(let i=0; i<15; i++) {
        const randIndex = Math.floor(Math.random() * tempArray.length);
        taPool.push(tempArray.splice(randIndex, 1)[0]);
    }
    
    taRound = 1;
    taSeconds = 0;
    updateTimerDisplay();
    
    // Iniciar Reloj
    taTimer = setInterval(() => {
        taSeconds++;
        updateTimerDisplay();
    }, 1000);
    
    UI.gameScreen.classList.add('active');
    startNewRound('next');
}

// Inicia el Modo Maestro de Tipos
function startTypeMaster() {
    currentMode = { id: 'typemaster', visual: null };
    hideAllScreens();
    
    tmScore = 0;
    tmStreak = 0;
    updateTypeStats();
    
    UI.typeScreen.classList.add('active');
    generateTypeMatch();
}

// ==========================================================================
// 7. LÓGICA PRINCIPAL (NOMBRES) - Manejo de Rondas
// ==========================================================================
function startNewRound(direction = 'next') {
    isAnimating = false;
    UI.input.disabled = false;
    UI.input.value = '';
    UI.input.focus();
    UI.feedback.textContent = '';
    UI.feedback.className = 'feedback-message';
    closeSuggestions();
    
    UI.image.className = currentMode.visual === 'silhouette' ? 'silhouette' : '';

    if (currentMode.id === 'timeattack') {
        // Lógica Contrarreloj
        if (taRound > 15) {
            clearInterval(taTimer);
            alert(`¡Tiempo final! Has completado los 15 Pokémon en ${formatTime(taSeconds)}. ¡Increíble!`);
            showMenu();
            return;
        }
        UI.progressDisplay.textContent = `${taRound}/15`;
        currentPokemon = taPool[taRound - 1];
        
    } else {
        // Lógica Clásica (Random / Pokédex)
        let availablePokemon = pokemonList.filter(p => !gameState.guessedIds.includes(p.name));
        
        if (availablePokemon.length === 0) {
            alert("¡Felicidades Maestro Pokémon! Has completado toda la Pokédex.");
            gameState.guessedIds = [];
            gameState.lastSeenId = 0;
            availablePokemon = pokemonList;
            saveProgress();
        }

        if (currentMode.id === 'random') {
            UI.prevBtn.style.display = 'none';
            const randomIndex = Math.floor(Math.random() * availablePokemon.length);
            currentPokemon = availablePokemon[randomIndex];
        } else if (currentMode.id === 'pokedex') {
            UI.prevBtn.style.display = 'block';
            
            if (direction === 'next') {
                let nextPokes = availablePokemon.filter(p => p.id > gameState.lastSeenId);
                if (nextPokes.length === 0) {
                    gameState.lastSeenId = 0; 
                    nextPokes = availablePokemon;
                }
                currentPokemon = nextPokes[0];
            } else if (direction === 'prev') {
                if (!currentPokemon) currentPokemon = availablePokemon[0];
                else {
                    let prevPokes = availablePokemon.filter(p => p.id < currentPokemon.id);
                    if (prevPokes.length > 0) currentPokemon = prevPokes[prevPokes.length - 1];
                }
            }
            gameState.lastSeenId = currentPokemon.id; 

            // Control visual del botón Anterior
            let hasPrev = availablePokemon.some(p => p.id < currentPokemon.id);
            UI.prevBtn.disabled = !hasPrev;
            UI.prevBtn.style.opacity = hasPrev ? '1' : '0.5';
            UI.prevBtn.style.cursor = hasPrev ? 'pointer' : 'not-allowed';
        }
    }

    // Cargar imagen de la carpeta "front"
    UI.image.src = `front/${currentPokemon.name}.png`;
    UI.image.onerror = () => { UI.image.alt = `[Falta imagen: front/${currentPokemon.name}.png]`; };
}

// ==========================================================================
// 8. LÓGICA PRINCIPAL (NOMBRES) - Comprobaciones
// ==========================================================================
function handleGuess() {
    if (isAnimating) return;
    
    const userGuess = UI.input.value.trim().toUpperCase();
    if (!userGuess) return;

    if (currentMode.id !== 'timeattack') gameState.totalAttempts++;
    
    const distance = getLevenshteinDistance(userGuess, currentPokemon.name);

    if (distance <= 1) handleCorrectGuess();
    else handleWrongGuess();
}

function handleCorrectGuess() {
    isAnimating = true;
    UI.input.disabled = true;
    
    // Si no es contrarreloj, guarda el progreso global
    if (currentMode.id !== 'timeattack') {
        gameState.score += 10;
        gameState.streak++;
        gameState.correctAttempts++;
        if (gameState.streak > gameState.highScore) gameState.highScore = gameState.streak;
        if (!gameState.guessedIds.includes(currentPokemon.name)) {
            gameState.guessedIds.push(currentPokemon.name);
        }
        saveProgress(); 
        updateUI();
    }
    
    UI.image.className = 'revealed'; 
    UI.card.classList.add('pulse-green');
    UI.feedback.textContent = `¡Correcto! Es ${currentPokemon.name}`;
    UI.feedback.className = 'feedback-message text-success';
    
    setTimeout(() => { 
        UI.card.classList.remove('pulse-green');
        if (currentMode.id === 'timeattack') taRound++;
        startNewRound('next'); 
    }, 1200);
}

function handleWrongGuess() {
    isAnimating = true;
    UI.input.disabled = true;
    
    if (currentMode.id !== 'timeattack') {
        gameState.streak = 0; 
        saveProgress(); 
        updateUI();
    }
    
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
    
    if (currentMode.id === 'timeattack') {
        // Penalización de tiempo
        taSeconds += 5; 
        updateTimerDisplay();
        UI.feedback.textContent = `+5 Segundos. Era... ${currentPokemon.name}`;
    } else {
        gameState.totalAttempts++; 
        gameState.streak = 0; 
        saveProgress(); 
        updateUI();
        UI.feedback.textContent = `Era... ${currentPokemon.name}`;
    }
    
    UI.image.className = 'revealed';
    UI.feedback.className = 'feedback-message text-error';
    
    setTimeout(() => { 
        if (currentMode.id === 'timeattack') taRound++;
        startNewRound('next'); 
    }, 1500);
}

function handlePrevious() {
    if (isAnimating || UI.prevBtn.disabled) return;
    startNewRound('prev');
}

// ==========================================================================
// 9. LÓGICA DEL MODO "MAESTRO DE TIPOS"
// ==========================================================================
function updateTypeStats() {
    UI.typeScore.textContent = tmScore;
    UI.typeStreak.textContent = tmStreak;
}

function generateTypeMatch() {
    isAnimating = false;
    UI.typeFeedback.textContent = '';
    UI.typeFeedback.className = 'feedback-message';
    
    // Limpia colores anteriores
    UI.attackType.className = 'type-badge';
    UI.defendType.className = 'type-badge';

    // Generar 2 tipos aleatorios
    currentAttackType = TYPES_LIST[Math.floor(Math.random() * TYPES_LIST.length)];
    currentDefendType = TYPES_LIST[Math.floor(Math.random() * TYPES_LIST.length)];

    // Asignar texto y colores dinámicos desde CSS
    UI.attackType.textContent = currentAttackType;
    UI.attackType.classList.add(`type-${currentAttackType}`);
    
    UI.defendType.textContent = currentDefendType;
    UI.defendType.classList.add(`type-${currentDefendType}`);
}

function handleTypeGuess(userMultiplier) {
    if (isAnimating) return;
    isAnimating = true;
    
    // Calcular multiplicador real consultando el diccionario
    let realMultiplier = 1; // Neutro por defecto
    if (TYPE_CHART[currentAttackType] && TYPE_CHART[currentAttackType][currentDefendType] !== undefined) {
        realMultiplier = TYPE_CHART[currentAttackType][currentDefendType];
    }

    if (userMultiplier === realMultiplier) {
        // Acierto
        tmScore += 10;
        tmStreak++;
        updateTypeStats();
        
        UI.typeCard.classList.add('pulse-green');
        UI.typeFeedback.textContent = '¡Respuesta Correcta!';
        UI.typeFeedback.className = 'feedback-message text-success';
        
        setTimeout(() => {
            UI.typeCard.classList.remove('pulse-green');
            generateTypeMatch();
        }, 1000);
        
    } else {
        // Fallo
        tmStreak = 0;
        updateTypeStats();
        
        UI.typeCard.classList.add('shake-red');
        
        // Crear mensaje explicativo del fallo
        let msg = `¡Fallo! Era x${realMultiplier}.`;
        if (realMultiplier === 2) msg = `¡Fallo! Era Súper Eficaz (x2).`;
        if (realMultiplier === 0.5) msg = `¡Fallo! Era Poco Eficaz (x0.5).`;
        if (realMultiplier === 0) msg = `¡Fallo! No le afecta (Inmune x0).`;
        if (realMultiplier === 1) msg = `¡Fallo! El daño era Neutro (x1).`;
        
        UI.typeFeedback.textContent = msg;
        UI.typeFeedback.className = 'feedback-message text-error';
        
        setTimeout(() => {
            UI.typeCard.classList.remove('shake-red');
            generateTypeMatch();
        }, 1800);
    }
}

// ==========================================================================
// 10. FUNCIONES DE CRONÓMETRO Y AUTOCOMPLETADO
// ==========================================================================
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    UI.timerDisplay.textContent = formatTime(taSeconds);
    
    // Si han pasado más de 60 segundos, se pone rojo intermitente (presión)
    if (taSeconds > 60) {
        document.querySelector('.timer-badge').classList.add('timer-danger');
    } else {
        document.querySelector('.timer-badge').classList.remove('timer-danger');
    }
}

function handleAutocomplete() {
    if (isAnimating) return;
    
    const value = UI.input.value.trim().toUpperCase();
    UI.suggestions.innerHTML = ''; 
    
    if (!value) { closeSuggestions(); return; }

    // En contrarreloj busca en la lista global también para dar pistas
    const matches = pokemonList.filter(p => 
        p.name.startsWith(value) && 
        (currentMode.id === 'timeattack' || !gameState.guessedIds.includes(p.name))
    );
    
    if (matches.length === 0) { closeSuggestions(); return; }

    matches.slice(0, 5).forEach(p => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = p.name;
        
        div.addEventListener('click', () => {
            if (isAnimating) return; 
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

// ==========================================================================
// 11. GALERÍA POKÉDEX (Renderizado)
// ==========================================================================
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

// ==========================================================================
// 12. UTILIDADES GLOBALES (Levenshtein y LocalStorage)
// ==========================================================================
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
    if (confirm('¿Estás seguro de que quieres borrar todo tu progreso? Tu Pokédex volverá a estar a 0.')) {
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