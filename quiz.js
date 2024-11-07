// quiz.js

document.addEventListener('DOMContentLoaded', () => {
    let allPluCodes = [];
    let questionPool = [];
    let wrongAnswers = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let comboCount = 0;
    let totalQuestions = 0;
    let timer;
    let timeLeft;
    const maxTime = 15; // Maximum time per question in seconds
    let timerEnabled = true;
    let quizMode = 'everything'; // Default mode
    let highScores = {
      withTimer: 0,
      withoutTimer: 0
    };
  
    const quizContainer = document.getElementById('quiz-container');
    const scoreDisplay = document.getElementById('score-display');
    const comboDisplay = document.getElementById('combo-display');
    const timerDisplay = document.getElementById('timer-display');
    const progressDisplay = document.getElementById('progress-display');
    const startScreen = document.getElementById('start-screen');
    const quizInterface = document.getElementById('quiz-interface');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');
    const exitButton = document.getElementById('exit-button');
    const pauseOverlay = document.getElementById('pause-overlay');
    const resumeButton = document.getElementById('resume-button');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const feedbackHeader = document.getElementById('feedback-header');
    const feedbackText = document.getElementById('feedback-text');
    const continueButton = document.getElementById('continue-button');
    const timerToggle = document.getElementById('timer-toggle');
    const timerStatus = document.getElementById('timer-status');
  
    fetch('data/plu-codes.json')
      .then(response => response.json())
      .then(data => {
        allPluCodes = data;
        setupStartScreen();
      })
      .catch(error => console.error('Error fetching PLU codes:', error));
  
    function setupStartScreen() {
      const modeButtons = document.querySelectorAll('.mode-button');
  
      let modeSelected = false;
  
      modeButtons.forEach(button => {
        button.addEventListener('click', () => {
          quizMode = button.getAttribute('data-mode');
          modeButtons.forEach(btn => btn.disabled = true);
          modeSelected = true;
          checkStartConditions();
        });
      });
  
      // Timer Toggle Event Listener
      timerToggle.addEventListener('change', () => {
        timerEnabled = timerToggle.checked;
        timerStatus.textContent = timerEnabled ? 'Timer On' : 'Timer Off';
      });
  
      function checkStartConditions() {
        if (modeSelected) {
          // Hide start screen and show quiz interface
          startScreen.style.display = 'none';
          quizInterface.style.display = 'block';
          startQuiz();
        }
      }
    }
  
    function startQuiz() {
      // Initialize variables
      questionPool = filterQuestionsByMode();
      questionPool = shuffleArray(questionPool);
      totalQuestions = questionPool.length;
      currentQuestionIndex = 0;
      score = 0;
      comboCount = 0;
      wrongAnswers = [];
      updateScoreDisplay();
      updateComboDisplay();
      loadQuestion();
    }
  
    function filterQuestionsByMode() {
      if (quizMode === 'produce') {
        return allPluCodes.filter(item => item.category === 'Produce');
      } else if (quizMode === 'non-produce') {
        return allPluCodes.filter(item => item.category !== 'Produce');
      } else {
        return [...allPluCodes];
      }
    }
  
    function loadQuestion() {
      // Check if we've gone through all questions
      if (currentQuestionIndex >= questionPool.length) {
        if (wrongAnswers.length > 0) {
          // Repeat wrong answers
          questionPool = [...wrongAnswers];
          wrongAnswers = [];
          currentQuestionIndex = 0;
          totalQuestions = questionPool.length;
          alert('Now reviewing incorrect answers.');
        } else {
          // Quiz is complete
          endQuiz();
          return;
        }
      }
  
      // Reset the container
      quizContainer.innerHTML = '';
      // Reset timer
      clearInterval(timer);
      timeLeft = maxTime;
      updateTimerDisplay();
      if (timerEnabled) {
        timerDisplay.style.display = 'block';
      } else {
        timerDisplay.style.display = 'none';
      }
  
      const currentQuestion = questionPool[currentQuestionIndex];
  
      // Update progress
      updateProgressDisplay();
  
      // Display the question
      const questionElement = document.createElement('p');
      questionElement.textContent = `What is the PLU code for ${currentQuestion.item}?`;
      questionElement.style.fontSize = '24px';
      questionElement.style.marginBottom = '20px';
      quizContainer.appendChild(questionElement);
  
      // Generate options
      const options = generateOptions(currentQuestion);
      options.forEach(option => {
        const label = document.createElement('label');
        label.classList.add('option');
  
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'plu-option';
        radio.value = option.code;
  
        label.appendChild(radio);
        label.appendChild(document.createTextNode(option.code));
        quizContainer.appendChild(label);
  
        // Automatic submission on selection
        label.addEventListener('click', () => {
          if (!isPaused) {
            checkAnswer(option.code, currentQuestion);
          }
        });
      });
  
      // Start the timer
      if (timerEnabled) {
        timer = setInterval(() => {
          if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
              clearInterval(timer);
              // Time's up, show feedback overlay
              feedback(false, currentQuestion, true);
            }
          }
        }, 1000);
      }
    }
  
    function checkAnswer(selectedCode, currentQuestion) {
      clearInterval(timer);
      const isCorrect = selectedCode === currentQuestion.code;
      feedback(isCorrect, currentQuestion, false);
    }
  
    function feedback(isCorrect, currentQuestion, timeOut) {
      // Display feedback overlay
      feedbackOverlay.style.display = 'block';
  
      if (isCorrect) {
        feedbackHeader.textContent = 'Correct!';
        feedbackHeader.style.color = 'green';
        feedbackText.textContent = '';
        comboCount++;
        // Increment score with combo bonus
        score += calculateScore(timeLeft, comboCount);
      } else {
        feedbackHeader.textContent = 'Incorrect!';
        feedbackHeader.style.color = 'red';
        if (timeOut) {
          feedbackText.textContent = `Time's up! The correct code for ${currentQuestion.item} is ${currentQuestion.code}.`;
        } else {
          feedbackText.textContent = `The correct code for ${currentQuestion.item} is ${currentQuestion.code}.`;
        }
        // Add to wrong answers to revisit later
        wrongAnswers.push(currentQuestion);
        // Reset combo count
        comboCount = 0;
      }
  
      updateScoreDisplay();
      updateComboDisplay();
  
      // Wait for the user to click "Continue" before proceeding to the next question
      continueButton.onclick = () => {
        feedbackOverlay.style.display = 'none';
        currentQuestionIndex++;
        loadQuestion();
      };
    }
  
    function calculateScore(timeLeft, comboCount) {
      // Example scoring formula with combo bonus
      let baseScore = 10;
      if (timerEnabled) {
        baseScore += timeLeft; // Bonus for time left
      }
      baseScore += comboCount * 5; // Combo bonus
      return baseScore;
    }
  
    function updateScoreDisplay() {
      scoreDisplay.textContent = `Score: ${score}`;
    }
  
    function updateComboDisplay() {
      comboDisplay.textContent = `Combo: ${comboCount}`;
    }
  
    function updateTimerDisplay() {
      timerDisplay.textContent = `Time Left: ${timeLeft}s`;
    }
  
    function updateProgressDisplay() {
      const total = totalQuestions + wrongAnswers.length;
      const current = currentQuestionIndex + 1;
      progressDisplay.textContent = `Question ${current} of ${total}`;
    }
  
    function generateOptions(currentQuestion) {
      const optionsSet = new Set();
      optionsSet.add(currentQuestion);
  
      while (optionsSet.size < 4) {
        const randomOption = allPluCodes[Math.floor(Math.random() * allPluCodes.length)];
        optionsSet.add(randomOption);
      }
  
      const optionsArray = Array.from(optionsSet);
      return shuffleArray(optionsArray);
    }
  
    function shuffleArray(array) {
      return array.sort(() => Math.random() - 0.5);
    }
  
    function endQuiz() {
      // Display final score
      quizContainer.innerHTML = '';
      timerDisplay.textContent = '';
      progressDisplay.textContent = '';
      comboDisplay.textContent = '';
  
      const finalMessage = document.createElement('p');
      finalMessage.textContent = `Quiz Complete! Your final score is ${score}.`;
      finalMessage.style.fontSize = '24px';
      finalMessage.style.textAlign = 'center';
      quizContainer.appendChild(finalMessage);
  
      // Update high score
      const highScoreKey = timerEnabled ? 'withTimer' : 'withoutTimer';
      if (score > highScores[highScoreKey]) {
        highScores[highScoreKey] = score;
        alert(`New High Score for ${timerEnabled ? 'Timed' : 'Untimed'} Mode: ${score}`);
      }
  
      // Option to restart the quiz
      const restartButton = document.createElement('button');
      restartButton.textContent = 'Restart Quiz';
      restartButton.className = 'restart-button';
      quizContainer.appendChild(restartButton);
  
      // Option to exit to main menu
      const exitButtonEnd = document.createElement('button');
      exitButtonEnd.textContent = 'Exit to Main Menu';
      exitButtonEnd.className = 'restart-button';
      quizContainer.appendChild(exitButtonEnd);
  
      restartButton.addEventListener('click', () => {
        startQuiz();
      });
  
      exitButtonEnd.addEventListener('click', () => {
        // Reset and go back to start screen
        resetToStartScreen();
      });
    }
  
    function resetToStartScreen() {
      // Reset variables
      questionPool = [];
      wrongAnswers = [];
      currentQuestionIndex = 0;
      score = 0;
      comboCount = 0;
      clearInterval(timer);
  
      // Hide quiz interface and show start screen
      quizInterface.style.display = 'none';
      startScreen.style.display = 'block';
  
      // Reset start screen buttons
      document.querySelectorAll('.mode-button').forEach(btn => {
        btn.disabled = false;
      });
    }
  
    // Control Buttons
    let isPaused = false;
  
    pauseButton.addEventListener('click', () => {
      if (!isPaused) {
        if (timerEnabled) {
          clearInterval(timer);
        }
        isPaused = true;
        pauseButton.disabled = true; // Disable pause button
        pauseOverlay.style.display = 'block';
      }
    });
  
    resumeButton.addEventListener('click', () => {
      if (timerEnabled) {
        timer = setInterval(() => {
          if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
              clearInterval(timer);
              feedback(false, questionPool[currentQuestionIndex], true);
            }
          }
        }, 1000);
      }
      isPaused = false;
      pauseButton.disabled = false; // Re-enable pause button
      pauseOverlay.style.display = 'none';
    });
  
    resetButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the quiz?')) {
        startQuiz();
      }
    });
  
    exitButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit the quiz?')) {
        resetToStartScreen();
      }
    });
  });
  