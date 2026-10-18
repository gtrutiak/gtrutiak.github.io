let quizData = [];
let currentQuiz = [];
let currentIndex = 0;
let correctCount = 0;
let answersHistory = [];
let skippedQuestions = new Set();
const TOTAL_QUESTIONS = 25;
const TIME_PER_QUESTION_MINUTES = 2; // 2 דקות לשאלה
let timeLeft = TOTAL_QUESTIONS * TIME_PER_QUESTION_MINUTES * 60;
let timerInterval;

fetch('questions.json')
    .then(response => response.json())
    .then(data => { quizData = data; startQuiz(); });

function startQuiz() {
    correctCount = 0; 
    currentIndex = 0; 
    timeLeft = TOTAL_QUESTIONS * TIME_PER_QUESTION_MINUTES * 60;
    answersHistory = new Array(TOTAL_QUESTIONS).fill(null);
    skippedQuestions.clear();
    
    // בחירת 25 שאלות אקראיות והכנת סדר אופציות קבוע מראש לכל שאלה
    currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, TOTAL_QUESTIONS).map(qObj => {
        const shuffledOptions = qObj.options.map((opt, index) => ({
            text: opt, 
            isCorrect: index === qObj.correct
        })).sort(() => 0.5 - Math.random());
        
        return {
            ...qObj,
            shuffledOptions: shuffledOptions
        };
    });

    startTimer();
    renderQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `Time Left: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) { clearInterval(timerInterval); showResults(); }
    }, 1000);
}

function updateSidebar() {
    const list = document.getElementById('nav-list');
    list.innerHTML = '';
    for (let i = 0; i < currentQuiz.length; i++) {
        const div = document.createElement('div');
        div.className = `nav-item ${i === currentIndex ? 'status-current' : answersHistory[i] ? 'status-answered' : skippedQuestions.has(i) ? 'status-skipped' : 'status-not-answered'}`;
        div.innerText = i + 1;
        div.style.cursor = "pointer";
        div.onclick = () => { 
            if (!answersHistory[i] && i !== currentIndex) { skippedQuestions.add(currentIndex); }
            currentIndex = i; 
            renderQuestion(); 
        };
        list.appendChild(div);
    }
    document.getElementById('progress-indicator').innerText = `Question: ${currentIndex + 1}/${TOTAL_QUESTIONS}`;
}

function prevQuestion() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } }

function nextQuestion() { 
    if (currentIndex < TOTAL_QUESTIONS - 1) { currentIndex++; renderQuestion(); } 
    else { showResults(); }
}

function renderQuestion() {
    const qObj = currentQuiz[currentIndex];
    const container = document.getElementById('question-area');
    
    container.classList.remove('fade-in');
    void container.offsetWidth;
    container.classList.add('fade-in');

    const historyItem = answersHistory[currentIndex];
    const isAnswered = !!historyItem;
    
    container.innerHTML = `<p style="line-height: 25px; margin-bottom: 20px;"><strong>Question ${currentIndex + 1}:</strong> ${qObj.q}</p>`;
    
    // שימוש בסדר האפשרויות השמור מראש לשאלה זו
    qObj.shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        if (isAnswered) {
            if (opt.isCorrect) {
                btn.classList.add('correct-option');
            } else if (historyItem.studentAnswer === opt.text && !opt.isCorrect) {
                btn.classList.add('wrong-option');
            }
        }
        
        btn.innerText = opt.text;
        btn.disabled = isAnswered;
        btn.onclick = () => { 
            skippedQuestions.delete(currentIndex); 
            showFeedback(opt.isCorrect, opt.text); 
        };
        container.appendChild(btn);
    });
    
    // הצגת חלונית המענה המובחנת בתחתית
    if (isAnswered) {
        const statusText = historyItem.isCorrect ? '<span style="color:#155724; font-weight:bold;">Correct!</span>' : '<span style="color:#721c24; font-weight:bold;">Incorrect</span>';
        
        const feedbackHtml = `
            <div class="feedback-card">
                <div class="feedback-row"><strong>Your Answer:</strong> <span>${historyItem.studentAnswer}</span> (${statusText})</div>
                <div class="feedback-row correct-answer-box"><strong>Correct Answer:</strong> <span>${historyItem.correctAnswer}</span></div>
            </div>
        `;
        document.getElementById('feedback-area').innerHTML = feedbackHtml;
    } else {
        document.getElementById('feedback-area').innerHTML = '';
    }
    
    document.getElementById('prev-btn').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('next-btn-nav').style.visibility = currentIndex === TOTAL_QUESTIONS - 1 ? 'hidden' : 'visible';
    
    updateSidebar();
}

function showFeedback(isCorrect, selectedText) {
    const qObj = currentQuiz[currentIndex];
    const correctAnswerText = qObj.options[qObj.correct];
    
    if (isCorrect) correctCount++;
    answersHistory[currentIndex] = { 
        q: qObj.q, 
        studentAnswer: selectedText, 
        correctAnswer: correctAnswerText, 
        isCorrect: isCorrect
    };

    renderQuestion();
}

function showResults() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('navigation-controls').style.display = 'none';
    document.getElementById('sidebar-footer').style.display = 'none';
    
    document.getElementById('nav-list').innerHTML = ''; 
    document.getElementById('sidebar-title').innerText = 'Exam Finished';
    
    const score = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
    document.getElementById('question-area').innerHTML = `<div style="text-align: center;">
        <h2>Quiz Finished!</h2>
        <p>Score: <strong>${score}%</strong> (${correctCount}/${TOTAL_QUESTIONS}) | Correct: ${correctCount} | Wrong: ${TOTAL_QUESTIONS - correctCount}</p>
        <button class="option-btn" onclick="showSummaryTable()">View Detailed Report</button>
        <button class="option-btn" onclick="location.reload()">Restart Quiz</button>
    </div>`;
    document.getElementById('feedback-area').innerHTML = '';
}

function showSummaryTable() {
    const score = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
    let tableHtml = `<div style="margin-bottom: 20px; font-weight: bold;">
        <p>Score: <strong>${score}%</strong> | Correct: ${correctCount} | Wrong: ${TOTAL_QUESTIONS - correctCount}</p>
    </div>
    <table><thead><tr><th>Question</th><th>Your Answer</th><th>Correct Answer</th></tr></thead><tbody>`;
    
    answersHistory.forEach(item => { 
        if(item) {
            tableHtml += `<tr class="${item.isCorrect ? 'table-correct' : 'table-wrong'}">
                <td>${item.q}</td>
                <td>${item.studentAnswer}</td>
                <td>${item.correctAnswer}</td>
            </tr>`; 
        }
    });
    
    tableHtml += `</tbody></table><button onclick="location.reload()" class="option-btn" style="margin-top:20px;">Back to Start</button>`;
    document.getElementById('question-area').innerHTML = tableHtml;
}