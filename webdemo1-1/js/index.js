
/**
 * Main Entry Point for the Application
 * Initializes all components and modules.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Sidebar (Core Navigation)
  const sidebar = new Sidebar('sidebar');

  // 2. Initialize Modules
  // Love Module (handles .love section)
  const love = new LoveModule();

  // Chatbot Module (handles .chatbot2 section)
  const chatbot = new ChatbotModule();

  // Speech Evaluation Module (handles .speech-evaluation section)
  const speechEval = new SpeechEvalModule();

  // Magic Tool Module (handles .magic-tool2 section)
  const magicTool = new MagicToolModule();

  // History Module (handles .history section)
  const history = new HistoryModule();

  // 3. Initialize Voice Module (Iframe)
  // The voice module is primarily an iframe, so no complex JS logic is needed here.
  // If interaction with the iframe is required later, a VoiceModule can be created.

  console.log("Application Initialized Successfully.");
});
