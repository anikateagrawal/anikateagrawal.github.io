/**
 * Beginner Coders Paradise - Universal Portal Content Loader
 * File: assets/js/portal-content-loader.js
 * Author: Anikate Agrawal
 */

const API_BASE_URL = 'https://beginner-coders-paradise.vercel.app/content';
const API_BASE_URL2 = 'http://localhost:5000/content';

// Store loaded sets to prevent unnecessary re-fetching
const loadedSetsCache = new Set();

const PortalContentLoader = {
  /**
   * Automatically detects Subject and Topic from the URL path or body data attributes
   */
  getSubjectAndTopic() {
    const body = document.body;
    let subject = body.getAttribute('data-subject');
    let topic = body.getAttribute('data-topic');

    if (!subject || !topic) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const htmlFileIndex = pathSegments.findIndex(seg => seg.endsWith('.html'));

      if (htmlFileIndex >= 2) {
        topic = pathSegments[htmlFileIndex - 1];
        subject = pathSegments[htmlFileIndex - 2];
      } else if (pathSegments.length >= 2) {
        topic = pathSegments[pathSegments.length - 1];
        subject = pathSegments[pathSegments.length - 2];
      }
    }

    return {
      subject: subject || 'DSA',
      topic: topic || 'Arrays'
    };
  },

  /**
   * Maps HTML tab keys to Backend Folder Type names
   */
  typeMapping: {
    'interview': 'InterviewQuestions',
    'problems': 'CodingProblems',
    'notes': 'Notes',
    'quizzes': 'Quiz'
  },

  /**
   * Core API Fetcher
   */
  async fetchSetData(subject, topic, backendType, setKey) {
    const url = `${API_BASE_URL}/${subject}/${topic}/${backendType}/${setKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch data');
    return json.data || [];
  },

  /**
   * Dynamically loads a specific set into a target container
   */
  async loadSet(tabKey, setNum, containerId) {
    const cacheKey = `${tabKey}-set-${setNum}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (loadedSetsCache.has(cacheKey) && container.children.length > 0) return;

    const { subject, topic } = this.getSubjectAndTopic();
    const backendType = this.typeMapping[tabKey] || tabKey;
    const setKey = `set${setNum}`;

    container.innerHTML = `
      <div class="flex items-center justify-center p-8 space-x-2 text-slate-400 text-xs font-medium">
        <i class="fa-solid fa-spinner fa-spin text-indigo-500 text-base"></i>
        <span>Loading ${backendType} (${setKey}) for ${subject} &gt; ${topic}...</span>
      </div>
    `;

    try {
      const data = await this.fetchSetData(subject, topic, backendType, setKey);

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="p-4 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20 flex items-center gap-2">
            <i class="fa-solid fa-circle-info"></i> No content found for ${subject} &gt; ${topic} (${setKey}).
          </div>
        `;
        return;
      }

      const renderer = this.renderers[tabKey];
      if (renderer) {
        renderer(data, container);
        loadedSetsCache.add(cacheKey);
      } else {
        container.innerHTML = `<p class="text-xs text-rose-500">No renderer for tab key: ${tabKey}</p>`;
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation"></i> Content not found!!
        </div>
      `;
    }
  },

  /**
   * Renderers for each tab section
   */
  renderers: {

    // 1. INTERVIEW QUESTIONS (THEORY)
    interview(data, container) {
      container.innerHTML = data.map((item, idx) => `
        <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm hover:border-indigo-500/40 transition-all">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-indigo-500">Q${item.id || idx + 1}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                ${item.subtopic || item.category || 'Theory'}
              </span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${
              item.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
              item.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
            }">${item.difficulty || 'Easy'}</span>
          </div>

          <h4 class="text-base font-bold text-slate-900 dark:text-white leading-snug">
            ${item.question}
          </h4>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong class="text-indigo-600 dark:text-indigo-400 block mb-1">Theoretical Answer:</strong>
            ${item.answer || item.theoretical_answer}
          </div>

          ${item.key_takeaway ? `
            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
              <i class="fa-solid fa-lightbulb text-amber-500"></i>
              <span><strong>Key Takeaway:</strong> ${item.key_takeaway}</span>
            </div>
          ` : ''}
        </div>
      `).join('');
    },

    // 2. PRACTICE CODING PROBLEMS
    problems(data, container) {
      container.innerHTML = data.map((item, idx) => {
        const probId = `prob-dynamic-${item.id || idx + 1}`;
        return `
          <div id="${probId}" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="text-xs font-semibold px-2 py-0.5 rounded ${
                  item.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  item.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }">${item.difficulty || 'Medium'}</span>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white mt-1">${item.id || idx + 1}. ${item.title}</h3>
              </div>
              ${item.leetcode_url && item.leetcode_url !== 'N/A' ? `
                <a href="${item.leetcode_url}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30 transition-all w-fit">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Solve on LeetCode
                </a>
              ` : ''}
            </div>

            ${item.theory_summary ? `<p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">${item.theory_summary}</p>` : ''}

            <div class="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-slate-400">Solution:</span>
                <button id="${probId}-btn-cpp" onclick="switchLang('${probId}', 'cpp')" class="lang-btn px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 text-white">C++</button>
                <button id="${probId}-btn-java" onclick="switchLang('${probId}', 'java')" class="lang-btn px-2.5 py-1 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Java</button>
                <button id="${probId}-btn-py" onclick="switchLang('${probId}', 'py')" class="lang-btn px-2.5 py-1 rounded text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Python</button>
              </div>

              <pre id="${probId}-code-cpp" class="code-block bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto"><code>${escapeHTML(item.code_cpp || item.code_solution || '// C++ solution coming soon')}</code></pre>
              <pre id="${probId}-code-java" class="code-block bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto hidden"><code>${escapeHTML(item.code_java || item.code_solution || '// Java solution coming soon')}</code></pre>
              <pre id="${probId}-code-py" class="code-block bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto hidden"><code>${escapeHTML(item.code_python || item.code_solution || '# Python solution coming soon')}</code></pre>
            </div>
          </div>
        `;
      }).join('');
    },

    // 3. SLIDES & NOTES
    notes(data, container) {
      container.innerHTML = data.map(item => {
        const isPdf = (item.file_type || '').toLowerCase().includes('pdf') || (item.download_url || '').endsWith('.pdf');
        return `
          <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="flex items-center gap-3">
              <i class="fa-solid ${isPdf ? 'fa-file-pdf text-rose-500' : 'fa-file-powerpoint text-amber-500'} text-3xl"></i>
              <div>
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">${item.title}</h4>
                <p class="text-xs text-slate-400">${item.description || item.file_type || 'Downloadable Document'}</p>
              </div>
            </div>
            <a href="${item.download_url || '#'}" download class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-2">
              <i class="fa-solid fa-download"></i> Download ${item.file_size ? `(${item.file_size})` : ''}
            </a>
          </div>
        `;
      }).join('');
    },

    // 4. INTERACTIVE QUIZZES (WITH EXPLANATION SUPPORT)
    quizzes(data, container) {
      container.innerHTML = data.map((item, qIdx) => {
        const safeExplanation = escapeHTML(item.explanation || item.correct_explanation || '');
        return `
          <div class="quiz-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm mb-4" 
               data-correct="${item.correct_option}" 
               data-explanation="${safeExplanation}">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Q${qIdx + 1}: ${item.question}</h3>
            
            <div class="space-y-2 text-xs">
              ${['a', 'b', 'c', 'd'].map(optKey => {
                const optVal = item[`option_${optKey}`];
                if (!optVal) return '';
                return `
                  <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <input type="radio" name="quiz_q_${item.id || qIdx}" value="${optKey.toUpperCase()}" class="accent-indigo-600">
                    <span><strong>${optKey.toUpperCase()}.</strong> ${optVal}</span>
                  </label>
                `;
              }).join('')}
            </div>

            <button onclick="PortalContentLoader.checkQuizAnswer(this, 'quiz_q_${item.id || qIdx}', 'quiz-msg-${qIdx}')" 
                    class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all">
              Submit Answer
            </button>
            <div id="quiz-msg-${qIdx}" class="hidden text-xs rounded-xl transition-all"></div>
          </div>
        `;
      }).join('');
    }
  },

  /**
   * Evaluates the selected option and displays the result + explanation
   */
  checkQuizAnswer(btnElement, radioName, resultId) {
    const card = btnElement.closest('.quiz-card');
    const correctOption = (card.getAttribute('data-correct') || '').trim().toUpperCase();
    const explanation = card.getAttribute('data-explanation') || '';
    
    const selected = card.querySelector(`input[name="${radioName}"]:checked`);
    const msg = document.getElementById(resultId);
    if (!msg) return;

    msg.className = 'text-xs p-4 rounded-xl space-y-2 mt-3'; // Reset base styling

    if (!selected) {
      msg.classList.add('bg-amber-500/10', 'text-amber-600', 'dark:text-amber-400', 'border', 'border-amber-500/20');
      msg.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> <strong>Please select an option before submitting!</strong>`;
      return;
    }

    const isCorrect = selected.value.trim().toUpperCase() === correctOption;

    if (isCorrect) {
      msg.classList.add('bg-emerald-500/10', 'border', 'border-emerald-500/20');
      msg.innerHTML = `
        <div class="font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <i class="fa-solid fa-circle-check text-sm"></i> Correct Answer! (Option ${correctOption})
        </div>
        ${explanation ? `
          <div class="pt-2 border-t border-emerald-500/20 text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong class="text-emerald-700 dark:text-emerald-400">Explanation:</strong> ${explanation}
          </div>
        ` : ''}
      `;
    } else {
      msg.classList.add('bg-rose-500/10', 'border', 'border-rose-500/20');
      msg.innerHTML = `
        <div class="font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <i class="fa-solid fa-circle-xmark text-sm"></i> Incorrect! The correct answer is Option ${correctOption}.
        </div>
        ${explanation ? `
          <div class="pt-2 border-t border-rose-500/20 text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong class="text-rose-700 dark:text-rose-400">Explanation:</strong> ${explanation}
          </div>
        ` : ''}
      `;
    }
  }
};

// Helper function to escape HTML special characters
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto Load active set on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  PortalContentLoader.loadSet('interview', 1, 'interview-set-1');
});