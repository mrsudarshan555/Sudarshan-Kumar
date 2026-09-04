import { QuizPayload, QuizQuestion } from '../../types';

export interface QuizConfig {
  subject?: string;
  chapter?: string;
  mode?: 'objective' | 'subjective';
  board?: string;
  questionCount?: number;
  language?: 'hi' | 'en';
}

export interface QuizPromptAnalysis {
  isQuizIntent: boolean;
  config: QuizConfig;
  missingFields: ('subject' | 'chapter' | 'mode' | 'board')[];
  isComplete: boolean;
  promptMessage: string;
  chips: { label: string; actionValue: string }[];
}

export interface QuizIntentResult {
  isQuiz: boolean;
  topic: string;
  questionCount: number;
  language: 'hi' | 'en';
}

export class QuizDataService {
  private static instance: QuizDataService;

  public static getInstance(): QuizDataService {
    if (!QuizDataService.instance) {
      QuizDataService.instance = new QuizDataService();
    }
    return QuizDataService.instance;
  }

  /**
   * Evaluates user input for quiz intent and detects already provided vs missing details:
   * 1) Subject/Vishay
   * 2) Chapter/Topic
   * 3) Mode (Objective vs Subjective)
   * 4) Board/Pattern (Bihar Board, CBSE, General)
   */
  public parseQuizIntentOrDetails(input: string, currentPending?: Partial<QuizConfig>): QuizPromptAnalysis {
    const raw = (input || '').trim().toLowerCase();

    // Check if input is a quiz trigger or continuation of pending config
    const isExplicitQuizTrigger = 
      raw.includes('quiz') ||
      raw.includes('prashnottari') ||
      raw.includes('प्रश्नोत्तरी') ||
      raw.includes('quize') ||
      raw.includes('mcq') ||
      raw.includes('objective') ||
      raw.includes('subjective') ||
      raw.includes('questions poocho') ||
      raw.includes('sawal poocho') ||
      raw.includes('test lo') ||
      raw.includes('pariksha') ||
      raw.includes('questions load karo') ||
      raw.includes('quiz load karo') ||
      raw.includes('quiz banao') ||
      raw.includes('quiz start karo') ||
      raw.includes('start quiz') ||
      raw.includes('take a quiz');

    const isContinuation = Boolean(currentPending && (
      currentPending.subject || currentPending.mode || currentPending.board || currentPending.chapter
    ));

    if (!isExplicitQuizTrigger && !isContinuation) {
      return {
        isQuizIntent: false,
        config: {},
        missingFields: ['subject', 'chapter', 'mode', 'board'],
        isComplete: false,
        promptMessage: '',
        chips: []
      };
    }

    const merged: QuizConfig = {
      subject: currentPending?.subject,
      chapter: currentPending?.chapter,
      mode: currentPending?.mode,
      board: currentPending?.board,
      questionCount: currentPending?.questionCount || 5,
      language: currentPending?.language || (/[\u0900-\u097F]/.test(input) ? 'hi' : 'hi')
    };

    // Clean raw string to strip out assistant names and vocative greetings for subject analysis:
    // "Mayra", "Stonicx", "Hey Mayra", "Mayra ji", etc. should NEVER become the quiz subject!
    const subjectCleanText = raw
      .replace(/\b(mayra|stonicx|mayraji|stonicxji|assistant|bot)\b/gi, ' ')
      .replace(/\b(hey|hello|hi|namaste|pranam|suno|sun|bhai|yaar|zara|kripya|please)\b/gi, ' ')
      .trim();

    // 1. Detect Subject / Vishay (using subjectCleanText to prevent assistant name contamination)
    if (subjectCleanText.includes('chemistry') || subjectCleanText.includes('rasayan') || subjectCleanText.includes('रसायन')) {
      merged.subject = 'Chemistry (रसायन विज्ञान)';
    } else if (subjectCleanText.includes('physics') || subjectCleanText.includes('bhautik') || subjectCleanText.includes('भौतिक')) {
      merged.subject = 'Physics (भौतिक विज्ञान)';
    } else if (subjectCleanText.includes('biology') || subjectCleanText.includes('jeev') || subjectCleanText.includes('जीव विज्ञान')) {
      merged.subject = 'Biology (जीव विज्ञान)';
    } else if (subjectCleanText.includes('science') || subjectCleanText.includes('vigyan') || subjectCleanText.includes('विज्ञान')) {
      merged.subject = 'Science (विज्ञान)';
    } else if (subjectCleanText.includes('math') || subjectCleanText.includes('ganit') || subjectCleanText.includes('गणित')) {
      merged.subject = 'Mathematics (गणित)';
    } else if (subjectCleanText.includes('gk') || subjectCleanText.includes('general knowledge') || subjectCleanText.includes('samanya gyan') || subjectCleanText.includes('सामान्य ज्ञान')) {
      merged.subject = 'General Knowledge (सामान्य ज्ञान)';
    } else if (subjectCleanText.includes('history') || subjectCleanText.includes('itihas') || subjectCleanText.includes('इतिहास')) {
      merged.subject = 'Indian History (भारत का इतिहास)';
    } else if (subjectCleanText.includes('geography') || subjectCleanText.includes('bhugol') || subjectCleanText.includes('भूगोल')) {
      merged.subject = 'Geography (भूगोल)';
    } else if (subjectCleanText.includes('constitution') || subjectCleanText.includes('samvidhan') || subjectCleanText.includes('संविधान') || subjectCleanText.includes('polity')) {
      merged.subject = 'Indian Constitution & Polity (संविधान)';
    } else if (/\b(computer|coding|tech|software|hardware|it)\b/i.test(subjectCleanText) || /\b(artificial intelligence)\b/i.test(subjectCleanText)) {
      merged.subject = 'Computer & AI (कंप्यूटर)';
    } else if (subjectCleanText.includes('hindi') || subjectCleanText.includes('हिंदी')) {
      merged.subject = 'Hindi (हिंदी)';
    } else if (subjectCleanText.includes('english') || subjectCleanText.includes('अंग्रेजी')) {
      merged.subject = 'English';
    } else if (!merged.subject) {
      // Look for "[topic] ka quiz" pattern using cleaned text
      const topicMatch = subjectCleanText.match(/(.+?)\s*(?:ka|ke|ki|par|about|on)?\s*(?:quiz|prashnottari|mcq|test)/i);
      if (topicMatch && topicMatch[1]) {
        const cleanTopic = topicMatch[1]
          .replace(/\b(mayra|stonicx|mayraji|stonicxji|assistant|bot|ai|agent)\b/gi, ' ')
          .replace(/\b(hey|hello|hi|namaste|pranam|suno|sun|bhai|yaar|zara|kripya|please|mere|lya|liye|mujhe|load|karo|karna|chahiye|chahta|chahti|banao|bana|ek|10|5|objective|subjective|bihar board|cbse|icse|up board|board|pattern|full syllabus)\b/gi, ' ')
          .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, ' ')
          .trim();
        
        const stopWords = new Set([
          'mayra', 'stonicx', 'assistant', 'bot', 'ai', 'gk', 'quiz', 'test', 'question', 'questions',
          'mcq', 'load', 'start', 'chalu', 'karo', 'karna', 'shuru', 'banao', 'ek', 'mere', 'mujhe',
          'liye', 'lya', 'hai', 'hain', 'ka', 'ke', 'ki', 'ko', 'se', 'me', 'mein', 'par'
        ]);

        if (cleanTopic.length > 2 && !stopWords.has(cleanTopic.toLowerCase())) {
          merged.subject = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
        }
      }
    }

    // 2. Detect Mode (Objective vs Subjective)
    if (raw.includes('objective') || raw.includes('mcq') || raw.includes('बहुविकल्पीय') || raw.includes('char option') || raw.includes('4 option') || raw.includes('ऑब्जेक्टिव')) {
      merged.mode = 'objective';
    } else if (raw.includes('subjective') || raw.includes('likh kar') || raw.includes('likhkar') || raw.includes('written') || raw.includes('descriptive') || raw.includes('लिखित') || raw.includes('सब्जेक्टिव') || raw.includes('khud likh')) {
      merged.mode = 'subjective';
    }

    // 3. Detect Board / Curriculum Pattern
    if (raw.includes('bihar board') || raw.includes('bseb') || raw.includes('बिहार बोर्ड') || raw.includes('bihar')) {
      merged.board = 'Bihar Board';
    } else if (raw.includes('cbse')) {
      merged.board = 'CBSE';
    } else if (raw.includes('icse')) {
      merged.board = 'ICSE';
    } else if (raw.includes('up board') || raw.includes('upboard') || raw.includes('यूपी बोर्ड')) {
      merged.board = 'UP Board';
    } else if (raw.includes('general') || raw.includes('samanya') || raw.includes('competition') || raw.includes('all board') || raw.includes('sabse') || raw.includes('rashtriya')) {
      merged.board = 'General Pattern';
    }

    // 4. Detect Chapter / Topic
    if (
      raw.includes('full syllabus') ||
      raw.includes('pure syllabus') ||
      raw.includes('pura syllabus') ||
      raw.includes('complete syllabus') ||
      raw.includes('sab chapters') ||
      raw.includes('all chapters') ||
      raw.includes('koi bhi') ||
      raw.includes('mixed') ||
      raw.includes('important topics') ||
      raw.includes('koi specific nahi')
    ) {
      merged.chapter = 'Full Syllabus';
    } else {
      // Check if user specified a chapter number or specific chapter name
      const chapterMatch = raw.match(/(?:chapter|adhyaay|adhyaya|topic)\s*([0-9a-z\u0900-\u097F\s\-]+)/i);
      if (chapterMatch && chapterMatch[1]) {
        const foundChapter = chapterMatch[1].trim();
        if (foundChapter.length > 1) {
          merged.chapter = `Chapter: ${foundChapter}`;
        }
      } else if (raw.includes('periodic table') || raw.includes('आवर्त सारणी')) {
        merged.chapter = 'Periodic Table (आवर्त सारणी)';
      } else if (raw.includes('thermodynamics') || raw.includes('ऊष्मागतिकी')) {
        merged.chapter = 'Thermodynamics (ऊष्मागतिकी)';
      } else if (raw.includes('kinetics') || raw.includes('बलगतिकी')) {
        merged.chapter = 'Chemical Kinetics (रासायनिक बलगतिकी)';
      } else if (raw.includes('organic') || raw.includes('कार्बनिक')) {
        merged.chapter = 'Organic Chemistry (कार्बनिक रसायन)';
      } else if (raw.includes('1857') || raw.includes('क्रांति') || raw.includes('revolt')) {
        merged.chapter = '1857 Revolt (1857 की क्रांति)';
      } else if (raw.includes('mughal') || raw.includes('मुगल')) {
        merged.chapter = 'Mughal Empire (मुगल साम्राज्य)';
      } else if (raw.includes('motion') || raw.includes('गति')) {
        merged.chapter = 'Motion & Laws (गति के नियम)';
      } else if (raw.includes('cell') || raw.includes('कोशिका')) {
        merged.chapter = 'Cell Biology (कोशिका विज्ञान)';
      }
    }

    // Determine missing fields
    const missingFields: ('subject' | 'chapter' | 'mode' | 'board')[] = [];
    if (!merged.subject) missingFields.push('subject');
    if (!merged.chapter) missingFields.push('chapter');
    if (!merged.mode) missingFields.push('mode');
    if (!merged.board) missingFields.push('board');

    const isComplete = missingFields.length === 0;

    // Generate response message and suggestion chips
    let promptMessage = '';
    const chips: { label: string; actionValue: string }[] = [];

    if (!isComplete) {
      if (missingFields.length === 4) {
        // Nothing was provided yet
        promptMessage = `Bilkul! Kripya yeh batayein:\n1) Kaunsa subject/vishay? (jaise Chemistry, GK, Math, etc.)\n2) Kaunsa chapter/topic? (agar specific ho to, ya pure syllabus par)\n3) Objective (MCQ) chahiye ya Subjective (khud likh kar answer)?\n4) Kis board/pattern ke hisaab se? (jaise Bihar Board, CBSE, ya general)`;
        
        chips.push(
          { label: '🧪 Chemistry (Bihar Board)', actionValue: 'Chemistry Bihar Board ka Objective quiz full syllabus' },
          { label: '📚 GK (General Pattern)', actionValue: 'GK General Knowledge ka Objective quiz full syllabus' },
          { label: '✍️ Subjective Quiz', actionValue: 'Chemistry ka Subjective quiz full syllabus Bihar Board' }
        );
      } else {
        // Some details were provided, ask ONLY for missing ones
        const knownParts: string[] = [];
        if (merged.subject) knownParts.push(merged.subject);
        if (merged.board) knownParts.push(merged.board);
        if (merged.mode) knownParts.push(merged.mode === 'objective' ? 'Objective (MCQ)' : 'Subjective (लिखित)');
        if (merged.chapter) knownParts.push(merged.chapter);

        const knownHeader = knownParts.length > 0 
          ? `बहुत बढ़िया! आपके ${knownParts.join(', ')} के लिए बस यह विवरण बता दीजिए:\n\n`
          : `Bilkul! Kripya yeh bacha hua vivaran batayein:\n\n`;

        const missingQuestions: string[] = [];
        missingFields.forEach((field, idx) => {
          if (field === 'subject') {
            missingQuestions.push(`${idx + 1}) Kaunsa subject/vishay? (jaise Chemistry, Physics, GK, Math)`);
            chips.push(
              { label: '🧪 Chemistry', actionValue: 'Chemistry' },
              { label: '⚛️ Physics', actionValue: 'Physics' },
              { label: '🌍 GK', actionValue: 'General Knowledge' }
            );
          } else if (field === 'chapter') {
            missingQuestions.push(`${idx + 1}) Kaunsa chapter/topic? (agar specific chapter ho to batayein, ya fir pure syllabus par bana doon?)`);
            chips.push(
              { label: '📖 Full Syllabus (पूरा सिलेबस)', actionValue: 'Pure syllabus par' },
              { label: '🔬 Important Topics', actionValue: 'Important chapters' }
            );
          } else if (field === 'mode') {
            missingQuestions.push(`${idx + 1}) Objective (MCQ) chahiye ya Subjective (khud likh kar answer)?`);
            chips.push(
              { label: '🔘 Objective (MCQ)', actionValue: 'Objective MCQ' },
              { label: '✍️ Subjective (Likh kar)', actionValue: 'Subjective likh kar' }
            );
          } else if (field === 'board') {
            missingQuestions.push(`${idx + 1}) Kis board/pattern ke hisaab se? (jaise Bihar Board, CBSE, ya general)`);
            chips.push(
              { label: '🏛️ Bihar Board', actionValue: 'Bihar Board' },
              { label: '📘 CBSE', actionValue: 'CBSE' },
              { label: '🌐 General Pattern', actionValue: 'General Pattern' }
            );
          }
        });

        promptMessage = knownHeader + missingQuestions.join('\n');
      }
    }

    return {
      isQuizIntent: true,
      config: merged,
      missingFields,
      isComplete,
      promptMessage,
      chips
    };
  }

  /**
   * Compatibility wrapper for old caller
   */
  public detectQuizIntent(input: string): QuizIntentResult {
    const analysis = this.parseQuizIntentOrDetails(input);
    return {
      isQuiz: analysis.isQuizIntent,
      topic: analysis.config.subject || 'General Knowledge (GK)',
      questionCount: analysis.config.questionCount || 5,
      language: analysis.config.language || 'hi'
    };
  }

  /**
   * Generates or fetches a complete rich quiz payload (Objective or Subjective)
   */
  public async getQuiz(
    config: {
      topic: string;
      chapter?: string;
      board?: string;
      mode?: 'objective' | 'subjective';
      count?: number;
      language?: 'hi' | 'en';
    } | string,
    fallbackCount: number = 5,
    fallbackLang: 'hi' | 'en' = 'hi'
  ): Promise<QuizPayload> {
    const topic = typeof config === 'string' ? config : (config.topic || 'General Knowledge');
    const chapter = typeof config === 'object' ? config.chapter : '';
    const board = typeof config === 'object' ? (config.board || 'General') : 'General';
    const mode = typeof config === 'object' ? (config.mode || 'objective') : 'objective';
    const count = typeof config === 'object' ? (config.count || 5) : fallbackCount;
    const language = typeof config === 'object' ? (config.language || 'hi') : fallbackLang;

    const quizId = `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const lowerTopic = topic.toLowerCase();
    const isSubjective = mode === 'subjective';

    // 1. Try server-side generation via Gemini API
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          chapter, 
          board, 
          mode, 
          count, 
          language 
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          return {
            id: quizId,
            title: data.title || `${topic} ${isSubjective ? 'वर्णनात्मक' : ''} प्रश्नोत्तरी`,
            topic,
            chapter: chapter || 'Full Syllabus',
            board,
            mode,
            introText: data.introText || (isSubjective
              ? `यहाँ आपके लिए ${topic} ${chapter ? '(' + chapter + ')' : ''} के महत्वपूर्ण प्रश्न हैं। नीचे बॉक्स में अपना उत्तर लिखें:`
              : `यहाँ आपके लिए ${topic} ${chapter ? '(' + chapter + ')' : ''} का एक मजेदार क्विज तैयार है। सही विकल्प चुनिए:`),
            questions: data.questions.map((q: any, i: number) => ({
              ...q,
              id: q.id || `q-${i + 1}`,
              type: mode
            })),
            growthAreas: data.growthAreas || ['अवधारणात्मक स्पष्टता', 'विषय ज्ञान', 'विश्लेषण'],
            suggestedTopics: [
              'रसायन विज्ञान (Chemistry)',
              'भौतिक विज्ञान (Physics)',
              'भारत का इतिहास (Indian History)',
              'सामान्य ज्ञान (General Knowledge)'
            ]
          };
        }
      }
    } catch (err) {
      console.log('[QuizDataService] Offline or fallback mode active:', err);
    }

    // 2. Curated Fallback Banks for both Subjective & Objective modes
    if (isSubjective) {
      return this.getCuratedSubjectiveQuiz(quizId, topic, chapter, board, count, language);
    }

    if (lowerTopic.includes('chemistry') || lowerTopic.includes('रसायन')) {
      return this.getChemistryQuiz(quizId, count, language);
    } else if (lowerTopic.includes('science') || lowerTopic.includes('vigyan') || lowerTopic.includes('विज्ञान')) {
      return this.getScienceQuiz(quizId, count, language);
    } else if (lowerTopic.includes('history') || lowerTopic.includes('itihas') || lowerTopic.includes('इतिहास')) {
      return this.getHistoryQuiz(quizId, count, language);
    }

    // Default: Master GK Quiz (Objective)
    return this.getMasterGkQuiz(quizId, count, language);
  }

  /**
   * Evaluates a subjective student answer
   */
  public async evaluateSubjectiveAnswer(
    question: string,
    userAnswer: string,
    modelAnswer: string,
    keywords: string[] = []
  ): Promise<{
    scorePercentage: number;
    status: 'correct' | 'partial' | 'incorrect';
    statusLabel: string;
    feedback: string;
    modelAnswer: string;
  }> {
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userAnswer,
          modelAnswer,
          keywords
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.error('[QuizDataService] Evaluation API error:', err);
    }

    // Client-side fallback evaluation
    const lowerUser = (userAnswer || '').toLowerCase().trim();
    if (!lowerUser) {
      return {
        scorePercentage: 0,
        status: 'incorrect',
        statusLabel: 'उत्तर रिक्त है',
        feedback: 'आपने कोई उत्तर नहीं लिखा है। कृपया प्रयास करें!',
        modelAnswer
      };
    }

    const matchedKeywords = keywords.filter((k) => lowerUser.includes(k.toLowerCase()));
    const lengthScore = Math.min(30, Math.round((lowerUser.length / 50) * 30));
    const keywordScore = keywords.length > 0 ? Math.round((matchedKeywords.length / keywords.length) * 70) : 50;
    const finalScore = Math.min(100, Math.max(35, lengthScore + keywordScore));

    return {
      scorePercentage: finalScore,
      status: finalScore >= 75 ? 'correct' : finalScore >= 45 ? 'partial' : 'incorrect',
      statusLabel: finalScore >= 75 ? 'उत्कृष्ट उत्तर' : finalScore >= 45 ? 'आंशिक रूप से सही' : 'सुधार की आवश्यकता',
      feedback: finalScore >= 75
        ? 'शाबाश! आपने मुख्य संकल्पनाओं को सटीक रूप से समझाया है।'
        : 'अच्छा प्रयास! आपके उत्तर में कुछ महत्वपूर्ण बिंदु शामिल हैं। आदर्श उत्तर देखकर इसे और बेहतर करें।',
      modelAnswer
    };
  }

  /**
   * Curated Subjective Quiz Fallback
   */
  private getCuratedSubjectiveQuiz(
    id: string,
    topic: string,
    chapter?: string,
    board?: string,
    count: number = 3,
    _language: 'hi' | 'en' = 'hi'
  ): QuizPayload {
    const isChemistry = topic.toLowerCase().includes('chemistry') || topic.toLowerCase().includes('रसायन');
    
    const questions: QuizQuestion[] = isChemistry ? [
      {
        id: 'sub-c-1',
        question: '1. मेंडलीफ की आवर्त सारणी और आधुनिक आवर्त सारणी में मुख्य अंतर क्या है?',
        type: 'subjective',
        modelAnswer: 'मेंडलीफ की आवर्त सारणी तत्वों के परमाणु भार (Atomic Mass) के बढ़ते क्रम पर आधारित थी, जबकि आधुनिक आवर्त सारणी (हेनरी मोजले द्वारा विकसित) तत्वों के परमाणु क्रमांक (Atomic Number) के बढ़ते क्रम पर आधारित है। आधुनिक सारणी में समस्थानिकों (Isotopes) को उचित स्थान मिला और विसंगतियाँ दूर हुईं।',
        keywords: ['परमाणु भार', 'परमाणु क्रमांक', 'Atomic Mass', 'Atomic Number', 'हेनरी मोजले'],
        evaluationCriteria: 'परमाणु भार और परमाणु क्रमांक के मूल अंतर का उल्लेख होना अनिवार्य है।',
        hint: 'तत्वों को व्यवस्थित करने के आधार (भार बनाम क्रमांक) पर ध्यान दें।'
      },
      {
        id: 'sub-c-2',
        question: '2. ऑक्सीकरण (Oxidation) और अपचयन (Reduction) अभिक्रिया को उदाहरण सहित समझाइए।',
        type: 'subjective',
        modelAnswer: 'ऑक्सीकरण वह रासायनिक प्रक्रिया है जिसमें कोई पदार्थ ऑक्सीजन प्राप्त करता है या इलेक्ट्रॉन त्यागता है (जैसे: 2Mg + O2 -> 2MgO)। अपचयन वह प्रक्रिया है जिसमें कोई पदार्थ ऑक्सीजन खोता है या इलेक्ट्रॉन ग्रहण करता है (जैसे: CuO + H2 -> Cu + H2O)। जब दोनों क्रियाएं साथ होती हैं तो उसे रेडॉक्स (Redox) अभिक्रिया कहते हैं।',
        keywords: ['इलेक्ट्रॉन त्यागना', 'ऑक्सीजन', 'इलेक्ट्रॉन ग्रहण', 'रेडॉक्स', 'Redox'],
        evaluationCriteria: 'इलेक्ट्रॉन त्यागने/ग्रहण करने अथवा ऑक्सीजन के जुड़ने/हटने का स्पष्ट विवरण।',
        hint: 'OIL RIG (Oxidation is Loss, Reduction is Gain) याद करें।'
      },
      {
        id: 'sub-c-3',
        question: '3. pH स्केल क्या है? अम्लीय और क्षारीय विलयन में इसका मान क्या होता है?',
        type: 'subjective',
        modelAnswer: 'pH स्केल किसी विलयन में हाइड्रोजन आयन [H+] की सांद्रता मापने का पैमाना है, जिसका मान 0 से 14 तक होता है। शुद्ध जल (उदासीन) का pH 7 होता है। अम्लीय विलयन का pH 7 से कम होता है तथा क्षारीय विलयन का pH 7 से अधिक होता है।',
        keywords: ['हाइड्रोजन आयन', '0 से 14', 'pH 7', 'उदासीन', 'अम्लीय', 'क्षारीय'],
        evaluationCriteria: '0-14 परास, 7 उदासीन, 7 से कम अम्लीय और 7 से अधिक क्षारीय का उल्लेख।',
        hint: 'सोरेन्सन द्वारा विकसित 0 से 14 तक का पैमाना।'
      }
    ] : [
      {
        id: 'sub-gk-1',
        question: '1. 1857 के प्रथम स्वतंत्रता संग्राम के मुख्य कारण क्या थे?',
        type: 'subjective',
        modelAnswer: '1857 की क्रांति के मुख्य कारणों में: राजनीतिक कारण (डलहौजी की हड़प नीति), आर्थिक कारण (अत्यधिक लगान और किसानों का शोषण), सामाजिक-धार्मिक कारण (धार्मिक मामलों में अंग्रेजों का हस्तक्षेप), और तात्कालिक कारण (चर्बी वाले कारतूसों का उपयोग, जिससे मंगल पांडे ने विद्रोह की शुरुआत की) शामिल थे।',
        keywords: ['हड़प नीति', 'चर्बी वाले कारतूस', 'मंगल पांडे', 'डलहौजी', 'शोषण'],
        evaluationCriteria: 'राजनीतिक, आर्थिक और तात्कालिक (चर्बी वाले कारतूस) कारणों का संतुलन।',
        hint: 'डलहौजी की नीति और चर्बी वाले कारतूस तात्कालिक कारण थे।'
      },
      {
        id: 'sub-gk-2',
        question: '2. भारतीय संविधान के अनुच्छेद 21 में दिए गए "जीवन के अधिकार" का क्या महत्व है?',
        type: 'subjective',
        modelAnswer: 'अनुच्छेद 21 घोषित करता है कि किसी भी व्यक्ति को उसके प्राण या दैहिक स्वतंत्रता से विधि द्वारा स्थापित प्रक्रिया के अतिरिक्त वंचित नहीं किया जाएगा। सर्वोच्च न्यायालय ने इसमें गरिमापूर्ण जीवन, निजता का अधिकार (Right to Privacy), स्वच्छ पर्यावरण और शिक्षा के अधिकार को भी शामिल किया है। यह मूल अधिकारों का सबसे महत्वपूर्ण आधार है।',
        keywords: ['दैहिक स्वतंत्रता', 'गरिमापूर्ण जीवन', 'निजता', 'सर्वोच्च न्यायालय', 'मूल अधिकार'],
        evaluationCriteria: 'प्राण एवं दैहिक स्वतंत्रता तथा न्यायिक व्याख्याओं का उल्लेख।',
        hint: 'यह मौलिक अधिकारों का सबसे व्यापक अनुच्छेद है।'
      },
      {
        id: 'sub-gk-3',
        question: '3. हरित क्रांति (Green Revolution) क्या थी और इसके भारत पर क्या प्रभाव पड़े?',
        type: 'subjective',
        modelAnswer: '1960 के दशक में एम. एस. स्वामीनाथन के नेतृत्व में उच्च उपज वाले बीज (HYV), आधुनिक सिंचाई, उर्वरकों और कीटनाशकों के प्रयोग से खाद्यान्न (विशेषकर गेहूं और चावल) उत्पादन में भारी वृद्धि को हरित क्रांति कहते हैं। इससे भारत खाद्यान्न में आत्मनिर्भर बना, हालांकि भूजल स्तर में गिरावट और क्षेत्रीय असमानता जैसी चुनौतियाँ भी आईं।',
        keywords: ['एम एस स्वामीनाथन', 'HYV बीज', 'गेहूं', 'चावल', 'आत्मनिर्भरता'],
        evaluationCriteria: 'स्वामीनाथन, HYV बीज, सकारात्मक प्रभाव और पर्यावरणीय प्रभाव का संतुलित उत्तर।',
        hint: 'एम. एस. स्वामीनाथन और गेहूं-चावल के उत्पादन में आत्मनिर्भरता।'
      }
    ];

    return {
      id,
      title: `${topic} ${board ? '(' + board + ')' : ''} वर्णनात्मक प्रश्नोत्तरी`,
      topic,
      chapter: chapter || 'Full Syllabus',
      board: board || 'General',
      mode: 'subjective',
      introText: `यहाँ आपके लिए ${topic} के महत्वपूर्ण वर्णनात्मक (Subjective) प्रश्न तैयार हैं। प्रत्येक प्रश्न का उत्तर अपने शब्दों में लिखें:`,
      questions: questions.slice(0, count),
      growthAreas: ['अवधारणात्मक गहराई', 'तथ्यात्मक सटीकता', 'संरचित उत्तर लेखन'],
      suggestedTopics: [
        'रसायन विज्ञान (Chemistry)',
        'भौतिक विज्ञान (Physics)',
        'भारतीय संविधान (Polity)',
        'भारत का इतिहास (History)'
      ]
    };
  }

  /**
   * Dedicated Chemistry Quiz
   */
  private getChemistryQuiz(id: string, count: number, _lang: 'hi' | 'en'): QuizPayload {
    const questions: QuizQuestion[] = [
      {
        id: 'cq-1',
        question: '1. आवर्त सारणी (Periodic Table) का जनक किसे कहा जाता है?',
        type: 'objective',
        correctAnswerIndex: 0,
        options: [
          { text: 'A. दिमित्री मेंडलीफ', explanation: 'सही! दिमित्री मेंडलीफ ने 1869 में आवर्त सारणी का पहला प्रारूप तैयार किया था।' },
          { text: 'B. हेनरी मोजले', explanation: 'गलत। हेनरी मोजले ने आधुनिक आवर्त सारणी (परमाणु संख्या पर आधारित) बनाई थी।' },
          { text: 'C. जॉन डाल्टन', explanation: 'गलत। डाल्टन ने परमाणु सिद्धांत (Atomic Theory) दिया था।' },
          { text: 'D. एंटोनी लैवोजियर', explanation: 'गलत। लैवोजियर को आधुनिक रसायन विज्ञान का जनक कहा जाता है।' }
        ],
        hint: 'रूसी रसायनज्ञ जिन्होंने परमाणु भार के आधार पर पहली बार तत्वों को व्यवस्थित किया था।'
      },
      {
        id: 'cq-2',
        question: '2. वायुमंडल में कौन सी गैस सबसे अधिक मात्रा में पाई जाती है?',
        type: 'objective',
        correctAnswerIndex: 2,
        options: [
          { text: 'A. ऑक्सीजन (O2)', explanation: 'गलत। ऑक्सीजन लगभग 21% मात्रा में पाई जाती है।' },
          { text: 'B. कार्बन डाइऑक्साइड (CO2)', explanation: 'गलत। CO2 वायुमंडल में मात्र 0.04% है।' },
          { text: 'C. नाइट्रोजन (N2)', explanation: 'सही! वायुमंडल में नाइट्रोजन लगभग 78.08% मात्रा में सबसे अधिक पाई जाती है।' },
          { text: 'D. आर्गन (Ar)', explanation: 'गलत। आर्गन लगभग 0.93% मात्रा में अक्रिय गैस के रूप में रहती है।' }
        ],
        hint: 'यह गैस लगभग 78 प्रतिशत हिस्से पर फैली हुई है।'
      },
      {
        id: 'cq-3',
        question: '3. शुद्ध जल (Pure Water) का pH मान कितना होता है?',
        type: 'objective',
        correctAnswerIndex: 1,
        options: [
          { text: 'A. 0', explanation: 'गलत। pH 0 अत्यधिक अम्लीय (Strong Acid) होता है।' },
          { text: 'B. 7', explanation: 'सही! शुद्ध जल उदासीन (Neutral) होता है और 25°C पर इसका pH मान 7 होता है।' },
          { text: 'C. 14', explanation: 'गलत। pH 14 अत्यधिक क्षारीय (Strong Base) होता है।' },
          { text: 'D. 5.6', explanation: 'गलत। 5.6 सामान्य वर्षा का हल्का अम्लीय pH हो सकता है।' }
        ],
        hint: 'यह मान उदासीन (Neutral) स्थिति को दर्शाता है।'
      },
      {
        id: 'cq-4',
        question: '4. साधारण नमक का रासायनिक नाम क्या है?',
        type: 'objective',
        correctAnswerIndex: 0,
        options: [
          { text: 'A. सोडियम क्लोराइड (NaCl)', explanation: 'सही! सामान्य खाने वाले नमक का रासायनिक नाम सोडियम क्लोराइड (NaCl) है।' },
          { text: 'B. सोडियम बाइकार्बोनेट (NaHCO3)', explanation: 'गलत। NaHCO3 बेकिंग सोडा (मीठा सोडा) का रासायनिक नाम है।' },
          { text: 'C. सोडियम कार्बोनेट (Na2CO3)', explanation: 'गलत। Na2CO3 धावन सोडा (Washing Soda) का रासायनिक नाम है।' },
          { text: 'D. कैल्शियम क्लोराइड (CaCl2)', explanation: 'गलत। यह खाने का नमक नहीं है।' }
        ],
        hint: 'इसका रासायनिक सूत्र NaCl है।'
      }
    ];

    return {
      id,
      title: 'रसायन विज्ञान (Chemistry) प्रश्नोत्तरी',
      topic: 'Chemistry',
      introText: 'यहाँ आपके लिए रसायन विज्ञान (Chemistry) का एक इंटरैक्टिव क्विज तैयार है। नीचे दिए गए बहुविकल्पीय प्रश्नों के सही उत्तर चुनिए:',
      questions: questions.slice(0, count),
      growthAreas: ['आवर्त सारणी', 'रासायनिक सूत्र', 'अम्ल और क्षार'],
      suggestedTopics: [
        'भौतिक विज्ञान (Physics)',
        'जीव विज्ञान (Biology)',
        'विज्ञान और तकनीक (Science & Tech)',
        'सामान्य ज्ञान (GK)'
      ]
    };
  }

  /**
   * Dedicated Science Quiz
   */
  private getScienceQuiz(id: string, count: number, _lang: 'hi' | 'en'): QuizPayload {
    const questions: QuizQuestion[] = [
      {
        id: 'sq-1',
        question: '1. प्रकाश की गति (Speed of Light) निर्वात में कितनी होती है?',
        type: 'objective',
        correctAnswerIndex: 0,
        options: [
          { text: 'A. 3 × 10^8 मीटर/सेकंड', explanation: 'सही! निर्वात में प्रकाश की चाल लगभग 3,00,000 किलोमीटर प्रति सेकंड (3 × 10^8 m/s) होती है।' },
          { text: 'B. 3 × 10^5 मीटर/सेकंड', explanation: 'गलत। यह 300 किमी/सेकंड है जो बहुत कम है।' },
          { text: 'C. 332 मीटर/सेकंड', explanation: 'गलत। 332 मीटर/सेकंड हवा में ध्वनि की गति होती है।' },
          { text: 'D. 11.2 किमी/सेकंड', explanation: 'गलत। 11.2 किमी/सेकंड पृथ्वी का पलायन वेग (Escape Velocity) है।' }
        ],
        hint: 'यह लगभग 3 लाख किलोमीटर प्रति सेकंड है।'
      },
      {
        id: 'sq-2',
        question: '2. किस रंग के प्रकाश का तरंगदैर्ध्य (Wavelength) सबसे अधिक होता है?',
        type: 'objective',
        correctAnswerIndex: 1,
        options: [
          { text: 'A. बैंगनी (Violet)', explanation: 'गलत। बैंगनी रंग की तरंगदैर्ध्य सबसे कम और आवृत्ति सबसे अधिक होती है।' },
          { text: 'B. लाल (Red)', explanation: 'सही! लाल रंग का तरंगदैर्ध्य सबसे अधिक (~700 nm) होता है, इसीलिए खतरे के निशान लाल होते हैं।' },
          { text: 'C. हरा (Green)', explanation: 'गलत। हरा रंग स्पेक्ट्रम के बीच में आता है।' },
          { text: 'D. पीला (Yellow)', explanation: 'गलत। पीले रंग की तरंगदैर्ध्य लाल से कम होती है।' }
        ],
        hint: 'इसी कारण खतरे के संकेत (Danger signals) इसी रंग के बनाए जाते हैं।'
      },
      {
        id: 'sq-3',
        question: '3. गुरुत्वाकर्षण का सार्वभौमिक नियम किसने दिया था?',
        type: 'objective',
        correctAnswerIndex: 2,
        options: [
          { text: 'A. अल्बर्ट आइंस्टीन', explanation: 'गलत। आइंस्टीन ने सापेक्षता का सिद्धांत (Relativity) दिया था।' },
          { text: 'B. गैलीलियो गैलीली', explanation: 'गलत। गैलीलियो ने दूरबीन का विकास और जड़त्व पर शोध किया था।' },
          { text: 'C. सर आइजक न्यूटन', explanation: 'सही! न्यूटन ने 1687 में प्रिंसिपिया में सार्वभौमिक गुरुत्वाकर्षण का नियम प्रतिपादित किया था।' },
          { text: 'D. निकोला टेस्ला', explanation: 'गलत। टेस्ला ने प्रत्यावर्ती धारा (AC) का आविष्कार किया था।' }
        ],
        hint: 'सेब गिरने की प्रसिद्ध घटना इनसे जुड़ी है।'
      }
    ];

    return {
      id,
      title: 'विज्ञान और तकनीक (Science & Tech) ज्ञान प्रश्नोत्तरी',
      topic: 'Science & Technology',
      introText: 'यहाँ आपके लिए विज्ञान और तकनीक (Science & Tech) का एक इंटरैक्टिव क्विज तैयार है। नीचे दिए गए प्रश्नों के उत्तर चुनिए:',
      questions: questions.slice(0, count),
      growthAreas: ['भौतिकी', 'प्रकाशिकी', 'अंतरिक्ष'],
      suggestedTopics: [
        'अंतरिक्ष और इसरो (Space & ISRO)',
        'कंप्यूटर और AI (Computer & AI)',
        'मानव शरीर और जीव विज्ञान',
        'सामान्य ज्ञान (Back to Main GK)'
      ]
    };
  }

  /**
   * Dedicated History Quiz
   */
  private getHistoryQuiz(id: string, count: number, _lang: 'hi' | 'en'): QuizPayload {
    const questions: QuizQuestion[] = [
      {
        id: 'hq-1',
        question: '1. सिंधु घाटी सभ्यता का सबसे प्रमुख बंदरगाह नगर कौन सा था?',
        type: 'objective',
        correctAnswerIndex: 1,
        options: [
          { text: 'A. हड़प्पा', explanation: 'गलत। हड़प्पा रावी नदी के तट पर स्थित मुख्य शहर था, बंदरगाह नहीं।' },
          { text: 'B. लोथल', explanation: 'सही! लोथल (गुजरात) में सिंधु घाटी सभ्यता का विशाल गोदीवाड़ा (Dockyard/बंदरगाह) मिला है।' },
          { text: 'C. मोहनजोदड़ो', explanation: 'गलत। मोहनजोदड़ो विशाल स्नानागार के लिए प्रसिद्ध है।' },
          { text: 'D. कालीबंगा', explanation: 'गलत। कालीबंगा जूते हुए खेत और चूड़ियों के लिए प्रसिद्ध है।' }
        ],
        hint: 'यह स्थल वर्तमान भारत के गुजरात राज्य में भोगवा नदी के पास स्थित है।'
      },
      {
        id: 'hq-2',
        question: '2. महात्मा गांधी ने दांडी यात्रा किस वर्ष शुरू की थी?',
        type: 'objective',
        correctAnswerIndex: 0,
        options: [
          { text: 'A. 1930', explanation: 'सही! गांधीजी ने 12 मार्च 1930 को साबरमती आश्रम से दांडी मार्च नमक कानून तोड़ने के लिए शुरू किया था।' },
          { text: 'B. 1920', explanation: 'गलत। 1920 में असहयोग आंदोलन (Non-Cooperation Movement) शुरू हुआ था।' },
          { text: 'C. 1942', explanation: 'गलत। 1942 में भारत छोड़ो आंदोलन (Quit India Movement) शुरू हुआ था।' },
          { text: 'D. 1919', explanation: 'गलत। 1919 में जलियांवाला बाग हत्याकांड हुआ था।' }
        ],
        hint: 'नमक सत्याग्रह और सविनय अवज्ञा आंदोलन का यह वर्ष 1930 था।'
      }
    ];

    return {
      id,
      title: 'भारत का इतिहास (Indian History) प्रश्नोत्तरी',
      topic: 'Indian History',
      introText: 'यहाँ आपके लिए भारतीय इतिहास के महत्वपूर्ण वस्तुनिष्ठ प्रश्नों का क्विज तैयार है:',
      questions: questions.slice(0, count),
      growthAreas: ['प्राचीन भारत', 'स्वतंत्रता संग्राम'],
      suggestedTopics: [
        'भूगोल (Geography)',
        'भारतीय संविधान (Polity)',
        'सामान्य ज्ञान (Main GK)'
      ]
    };
  }

  /**
   * Master General Knowledge Quiz (Exact 10 questions from user's video)
   */
  private getMasterGkQuiz(id: string, count: number, _language: 'hi' | 'en'): QuizPayload {
    const allQuestions: QuizQuestion[] = [
      {
        id: 'q-1',
        question: '1. पानीपत का प्रथम युद्ध किस वर्ष लड़ा गया था?',
        type: 'objective',
        correctAnswerIndex: 1, // B
        options: [
          { text: 'A. 1528', explanation: 'गलत। 1528 में चंदेरी का युद्ध हुआ था जिसमें बाबर ने मेदिनी राय को हराया था।' },
          { text: 'B. 1526', explanation: 'सही! पानीपत का प्रथम युद्ध 21 अप्रैल 1526 को बाबर और इब्राहिम लोदी के बीच लड़ा गया था।' },
          { text: 'C. 1556', explanation: 'गलत। 1556 में पानीपत का द्वितीय युद्ध लड़ा गया था।' },
          { text: 'D. 1761', explanation: 'गलत। 1761 में पानीपत का तृतीय युद्ध लड़ा गया था।' }
        ],
        hint: 'बाबर और इब्राहिम लोदी के बीच हुए प्रसिद्ध युद्ध का वर्ष याद करें।'
      },
      {
        id: 'q-2',
        question: '2. 1857 के स्वतंत्रता संग्राम के समय भारत का गवर्नर-जनरल कौन था?',
        type: 'objective',
        correctAnswerIndex: 2, // C
        options: [
          { text: 'A. लॉर्ड डलहौजी', explanation: 'गलत। लॉर्ड डलहौजी 1857 से पहले (1848-1856 तक) गवर्नर-जनरल थे, जिनकी हड़प नीति (Doctrine of Lapse) ने असंतोष पैदा किया था।' },
          { text: 'B. लॉर्ड विलियम बेंटिक', explanation: 'गलत। लॉर्ड विलियम बेंटिक 19वीं सदी के शुरुआत (1828-1835) में गवर्नर-जनरल रहे थे।' },
          { text: 'C. लॉर्ड कैनिंग', explanation: 'सही! 1857 की क्रांति के समय लॉर्ड कैनिंग भारत के गवर्नर-जनरल थे और बाद में यह देश के पहले वायसराय बने।' },
          { text: 'D. लॉर्ड कर्जन', explanation: 'गलत। लॉर्ड कर्जन ने 1905 में बंगाल विभाजन किया था।' }
        ],
        hint: 'उस व्यक्ति का नाम याद करें जो क्रांति के समय शासन संभाल रहा था और जिसे बाद में भारत का पहला वायसराय बनाया गया।'
      },
      {
        id: 'q-3',
        question: '3. भारत की सबसे लंबी नदी कौन सी है?',
        type: 'objective',
        correctAnswerIndex: 0, // A
        options: [
          { text: 'A. गंगा', explanation: 'सही! गंगा भारत की सबसे लंबी नदी है, जिसकी कुल लंबाई लगभग 2,525 किलोमीटर है।' },
          { text: 'B. यमुना', explanation: 'गलत। यमुना गंगा की सबसे बड़ी सहायक नदी है, लेकिन यह सबसे लंबी नदी नहीं है।' },
          { text: 'C. ब्रह्मपुत्र', explanation: 'गलत। ब्रह्मपुत्र की कुल लंबाई गंगा से अधिक है, लेकिन भारत के भीतर बहने वाला इसका हिस्सा गंगा से छोटा है।' },
          { text: 'D. गोदावरी', explanation: 'गलत। गोदावरी को दक्षिण भारत की सबसे लंबी नदी कहा जाता है, पूरे भारत की नहीं।' }
        ],
        hint: 'यह नदी गंगोत्री हिमनद से निकलती है और बंगाल की खाड़ी में जाकर गिरती है।'
      },
      {
        id: 'q-4',
        question: '4. हमारे सौरमंडल का सबसे बड़ा ग्रह कौन सा है?',
        type: 'objective',
        correctAnswerIndex: 3, // D
        options: [
          { text: 'A. शनि', explanation: 'गलत। शनि सौरमंडल का दूसरा सबसे बड़ा ग्रह है, जो अपने सुंदर छल्लों (rings) के लिए जाना जाता है।' },
          { text: 'B. पृथ्वी', explanation: 'गलत। पृथ्वी सौरमंडल का पाँचवाँ सबसे बड़ा ग्रह है।' },
          { text: 'C. मंगल', explanation: 'गलत। मंगल को लाल ग्रह माना जाता है, लेकिन यह आकार में काफी छोटा है।' },
          { text: 'D. बृहस्पति', explanation: 'सही! बृहस्पति (Jupiter) हमारे सौरमंडल का सबसे बड़ा ग्रह है। यह एक गैस दानव (gas giant) है।' }
        ],
        hint: 'यह एक गैस दानव (gas giant) है और इसका नाम रोमन पौराणिक कथाओं में देवताओं के राजा के नाम पर रखा गया है।'
      },
      {
        id: 'q-5',
        question: '5. विटामिन \'C\' की कमी से निम्नलिखित में से कौन सा रोग होता है?',
        type: 'objective',
        correctAnswerIndex: 1, // B
        options: [
          { text: 'A. रतौंधी (Night Blindness)', explanation: 'गलत। रतौंधी विटामिन \'A\' की कमी से होती है।' },
          { text: 'B. स्कर्वी (Scurvy)', explanation: 'सही! विटामिन \'C\' की कमी से मसूड़ों से खून आना और स्कर्वी नामक रोग हो जाता है।' },
          { text: 'C. बेरी-बेरी', explanation: 'गलत। बेरी-बेरी रोग विटामिन \'B1\' (थायमिन) की कमी के कारण होता है।' },
          { text: 'D. रिकेट्स (Rickets)', explanation: 'गलत। रिकेट्स रोग विटामिन \'D\' की कमी से होता है जिसमें हड्डियां कमजोर हो जाती हैं।' }
        ],
        hint: 'यह रोग खट्टे फलों (जैसे नींबू, संतरा, आंवला) के कम सेवन से हो सकता है।'
      },
      {
        id: 'q-6',
        question: '6. मानव शरीर में कुल कितनी हड्डियाँ (Bones) होती हैं?',
        type: 'objective',
        correctAnswerIndex: 2, // C
        options: [
          { text: 'A. 300', explanation: 'गलत। नवजात शिशु के शरीर में लगभग 300 हड्डियाँ होती हैं, जो बड़े होने पर जुड़ जाती हैं।' },
          { text: 'B. 180', explanation: 'गलत। वयस्क मानव शरीर में 180 से अधिक हड्डियाँ होती हैं।' },
          { text: 'C. 206', explanation: 'सही! एक वयस्क मनुष्य के शरीर में कुल 206 हड्डियाँ होती हैं।' },
          { text: 'D. 212', explanation: 'गलत। यह संख्या सही नहीं है, सामान्य वयस्क शरीर में 206 हड्डियाँ होती हैं।' }
        ],
        hint: 'यह संख्या दो सौ से अधिक और दो सौ दस से कम है।'
      },
      {
        id: 'q-7',
        question: '7. ओलंपिक खेलों में व्यक्तिगत स्वर्ण पदक जीतने वाले पहले भारतीय कौन हैं?',
        type: 'objective',
        correctAnswerIndex: 0, // A
        options: [
          { text: 'A. अभिनव बिंद्रा', explanation: 'सही! अभिनव बिंद्रा ने 2008 बीजिंग ओलंपिक में 10 मीटर एयर राइफल स्पर्धा में स्वर्ण पदक जीता था।' },
          { text: 'B. नीरज चोपड़ा', explanation: 'गलत। नीरज चोपड़ा ने 2020 टोक्यो ओलंपिक में भाला फेंक में दूसरा व्यक्तिगत स्वर्ण पदक जीता था।' },
          { text: 'C. सुशील कुमार', explanation: 'गलत। सुशील कुमार ने ओलंपिक में कांस्य और रजत पदक जीते हैं।' },
          { text: 'D. मिल्खा सिंह', explanation: 'गलत। \'फ्लाइंग सिख\' मिल्खा सिंह 1960 रोम ओलंपिक में चौथे स्थान पर रहे थे।' }
        ],
        hint: 'इन्होंने 2008 के बीजिंग ओलंपिक में निशानेबाजी (Shooting) में स्वर्ण पदक जीता था।'
      },
      {
        id: 'q-8',
        question: '8. भारत के संविधान का जनक (Father of the Indian Constitution) किसे माना जाता है?',
        type: 'objective',
        correctAnswerIndex: 2, // C
        options: [
          { text: 'A. डॉ. राजेन्द्र प्रसाद', explanation: 'गलत। डॉ. राजेन्द्र प्रसाद संविधान सभा के अध्यक्ष और भारत के पहले राष्ट्रपति थे।' },
          { text: 'B. पंडित जवाहरलाल नेहरू', explanation: 'गलत। पंडित नेहरू ने उद्देश्य प्रस्ताव (Objective Resolution) पेश किया था।' },
          { text: 'C. डॉ. भीमराव अंबेडकर', explanation: 'सही! डॉ. भीमराव अंबेडकर प्रारूप समिति (Drafting Committee) के अध्यक्ष थे और उन्हें संविधान का मुख्य वास्तुकार माना जाता है।' },
          { text: 'D. सरदार वल्लभभाई पटेल', explanation: 'गलत। सरदार पटेल भारत के पहले उप-प्रधानमंत्री और गृह मंत्री थे।' }
        ],
        hint: 'वे संविधान की प्रारूप समिति (Drafting Committee) के अध्यक्ष थे।'
      },
      {
        id: 'q-9',
        question: '9. विश्व का सबसे बड़ा महासागर कौन सा है?',
        type: 'objective',
        correctAnswerIndex: 1, // B
        options: [
          { text: 'A. अटलांटिक महासागर', explanation: 'गलत। अटलांटिक दूसरा सबसे बड़ा महासागर है और \'S\' आकार का दिखता है।' },
          { text: 'B. प्रशांत महासागर', explanation: 'सही! प्रशांत महासागर (Pacific Ocean) पृथ्वी का सबसे बड़ा और सबसे गहरा महासागर है।' },
          { text: 'C. हिंद महासागर', explanation: 'गलत। हिंद महासागर तीसरा सबसे बड़ा महासागर है।' },
          { text: 'D. आर्कटिक महासागर', explanation: 'गलत। आर्कटिक सबसे छोटा और उथला महासागर है।' }
        ],
        hint: 'मारियाना गर्त (Mariana Trench), जो पृथ्वी का सबसे गहरा स्थान है, इसी महासागर में स्थित है।'
      },
      {
        id: 'q-10',
        question: '10. प्रकाश वर्ष (Light Year) निम्नलिखित में से किस भौतिक राशि की इकाई है?',
        type: 'objective',
        correctAnswerIndex: 2, // C
        options: [
          { text: 'A. समय (Time)', explanation: 'गलत। नाम में \'वर्ष\' होने के बावजूद यह समय की इकाई नहीं है।' },
          { text: 'B. प्रकाश की तीव्रता (Intensity of Light)', explanation: 'गलत। प्रकाश तीव्रता की इकाई कैंडेला (Candela) होती है।' },
          { text: 'C. खगोलीय दूरी (Distance)', explanation: 'सही! प्रकाश वर्ष दूरी (Distance) की इकाई है। यह वह दूरी है जो प्रकाश एक वर्ष में निर्वात में तय करता है (~9.46 × 10^12 किमी)।' },
          { text: 'D. चाल (Speed)', explanation: 'गलत। चाल की इकाई मीटर/सेकंड या किमी/घंटा होती है।' }
        ],
        hint: 'यह उस दूरी को मापता है जो प्रकाश एक वर्ष में निर्वात में तय करता है।'
      }
    ];

    return {
      id,
      title: 'सामान्य ज्ञान (Master GK) ज्ञान प्रश्नोत्तरी',
      topic: 'General Knowledge',
      introText: 'यहाँ आपके लिए सामान्य ज्ञान के 10 सबसे महत्वपूर्ण वस्तुनिष्ठ प्रश्नों का एक संग्रह तैयार है। प्रत्येक प्रश्न का सही उत्तर चुनिए और अपना स्कोर देखिए:',
      questions: allQuestions.slice(0, count),
      growthAreas: [
        'इतिहास',
        'भूगोल',
        'विज्ञान और पर्यावरण'
      ],
      suggestedTopics: [
        'भारत का इतिहास (Indian History)',
        'विज्ञान और तकनीक (Science & Tech)',
        'खेल-कूद (Sports GK)',
        'भूगोल (Geography)',
        'भारतीय संविधान (Indian Constitution)'
      ]
    };
  }
}
