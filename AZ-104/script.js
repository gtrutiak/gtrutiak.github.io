let quizData = [];
let currentQuiz = [];
let currentIndex = 0;
let correctCount = 0;
let answersHistory = [];
let skippedQuestions = new Set();
let timeLeft = 20 * 60;
let timerInterval;

fetch('questions.json')
    .then(response => response.json())
    .then(data => { quizData = data; startQuiz(); });

function startQuiz() {
    correctCount = 0; currentIndex = 0; 
    timeLeft = 20 * 60;
    answersHistory = new Array(20).fill(null);
    skippedQuestions.clear();
    currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, 20);
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
    document.getElementById('progress-indicator').innerText = `Question: ${currentIndex + 1}/20`;
}

function prevQuestion() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } }

function nextQuestion() { 
    if (currentIndex < 19) { currentIndex++; renderQuestion(); } 
    else { showResults(); }
}

function renderQuestion() {
    const qObj = currentQuiz[currentIndex];
    const container = document.getElementById('question-area');
    
    container.classList.remove('fade-in');
    void container.offsetWidth;
    container.classList.add('fade-in');

    const isAnswered = !!answersHistory[currentIndex];
    container.innerHTML = `<p style="line-height: 25px; margin-bottom: 20px;"><strong>Question ${currentIndex + 1}:</strong> ${qObj.q}</p>`;
    
    const options = qObj.options.map((opt, index) => ({text: opt, isCorrect: index === qObj.correct})).sort(() => 0.5 - Math.random());
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.text;
        btn.disabled = isAnswered;
        btn.onclick = () => { 
            skippedQuestions.delete(currentIndex); 
            showFeedback(opt.isCorrect, opt.text); 
        };
        container.appendChild(btn);
    });
    
    document.getElementById('feedback-area').innerHTML = isAnswered ? `<div class="${answersHistory[currentIndex].isCorrect ? 'correct' : 'wrong'}" style="padding: 15px; border-radius: 12px; margin-top: 10px;">Already answered.</div>` : '';
    
    document.getElementById('prev-btn').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('next-btn-nav').style.visibility = currentIndex === 19 ? 'hidden' : 'visible';
    
    updateSidebar();
}

function showFeedback(isCorrect, selectedText) {
    if (isCorrect) correctCount++;
    answersHistory[currentIndex] = { q: currentQuiz[currentIndex].q, studentAnswer: selectedText, correctAnswer: currentQuiz[currentIndex].options[currentQuiz[currentIndex].correct], isCorrect: isCorrect };
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
    document.getElementById('feedback-area').innerHTML = `<div class="${isCorrect ? 'correct' : 'wrong'}" style="padding: 15px; border-radius: 12px; margin-top: 10px;">${isCorrect ? "Correct!" : "Wrong."}</div>`;
    updateSidebar();
}

function showResults() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('navigation-controls').style.display = 'none';
    document.getElementById('sidebar-footer').style.display = 'none';
    
    // נעילה מוחלטת לאחר סיום: ניקוי הניווט
    document.getElementById('nav-list').innerHTML = ''; 
    document.getElementById('sidebar-title').innerText = 'Exam Finished';
    
    document.getElementById('question-area').innerHTML = `<div style="text-align: center;"><h2>Quiz Finished!</h2><p>Score: <strong>${correctCount * 5}</strong> | Correct: ${correctCount} | Wrong: ${20 - correctCount}</p><button class="option-btn" onclick="showSummaryTable()">View Detailed Report</button><button class="option-btn" onclick="location.reload()">Restart Quiz</button></div>`;
    document.getElementById('feedback-area').innerHTML = '';
}

function showSummaryTable() {
    let tableHtml = `<div style="margin-bottom: 20px; font-weight: bold;"><p>Score: <strong>${correctCount * 5}</strong> | Correct: ${correctCount} | Wrong: ${20 - correctCount}</p></div>
                     <table><thead><tr><th>Question</th><th>Your Answer</th><th>Correct</th></tr></thead><tbody>`;
    answersHistory.forEach(item => { if(item) tableHtml += `<tr class="${item.isCorrect ? 'table-correct' : 'table-wrong'}"><td>${item.q}</td><td>${item.studentAnswer}</td><td>${item.correctAnswer}</td></tr>`; });
    tableHtml += `</tbody></table><button onclick="location.reload()" class="option-btn" style="margin-top:20px;">Back to Start</button>`;
    document.getElementById('question-area').innerHTML = tableHtml;
}