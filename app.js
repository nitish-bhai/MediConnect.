// Main application logic
(function() {
    // DOM elements
    const callStatus = document.getElementById('call-status');
    const statusIndicator = document.getElementById('status-indicator');
    const timerElement = document.getElementById('timer');
    const transcriptContainer = document.getElementById('transcript-container');
    const noTranscript = document.getElementById('no-transcript');
    const callHistory = document.getElementById('call-history');
    const noHistory = document.getElementById('no-history');
    const reportSection = document.getElementById('report-section');
    const reportContent = document.getElementById('report-content');
    const generateReportBtn = document.getElementById('generate-report');
    const muteButton = document.getElementById('mute-btn');
    const conversationModal = document.getElementById('conversation-modal');
    const closeConversationModal = document.getElementById('close-conversation-modal');
    const conversationTranscript = document.getElementById('conversation-transcript');
    const summarizeChatBtn = document.getElementById('summarize-chat');
    const closeReportBtn = document.getElementById('close-report');
    const downloadReportBtn = document.getElementById('download-report');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Application state
    let callActive = false;
    let callStartTime = null;
    let timerInterval = null;
    let isMuted = false;
    let isRecording = false;
    let currentConversation = [];
    let callHistoryData = JSON.parse(localStorage.getItem('mediVoiceCallHistory')) || [];
    let currentViewingCall = null;

    // Gemini API Configuration - UPDATED WITH WORKING API KEY
    const GEMINI_API_KEY = "AIzaSyAwIwXUfcuSFW0b2j0iDLb_YWpSitGwqZg";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Initialize the app
    function initApp() {
        renderCallHistory();
        setupEventListeners();
        setupModalEvents();
        console.log('Application initialized successfully');
    }

    // Set up event listeners
    function setupEventListeners() {
        // Mute button
        muteButton.addEventListener('click', function() {
            isMuted = !isMuted;
            this.classList.toggle('active', isMuted);
            this.innerHTML = isMuted ? 
                '<i class="fas fa-microphone-slash"></i>' : 
                '<i class="fas fa-microphone"></i>';
            console.log('Microphone ' + (isMuted ? 'muted' : 'unmuted'));
        });

        // Record button
        document.getElementById('record-btn').addEventListener('click', function() {
            isRecording = !isRecording;
            this.classList.toggle('active', isRecording);
            this.innerHTML = isRecording ? 
                '<i class="fas fa-square"></i>' : 
                '<i class="fas fa-record-vinyl"></i>';
            console.log('Recording:', isRecording ? 'Started' : 'Stopped');
        });

        // Clear history
        clearHistoryBtn.addEventListener('click', function() {
            clearHistory();
        });

        // Generate report
        generateReportBtn.addEventListener('click', function() {
            generateReport();
        });

        // Download report
        downloadReportBtn.addEventListener('click', function() {
            downloadReport();
        });

        // Close report
        closeReportBtn.addEventListener('click', function() {
            reportSection.style.display = 'none';
        });

        // Summarize chat button - DIRECT EVENT LISTENER
        if (summarizeChatBtn) {
            summarizeChatBtn.addEventListener('click', handleSummarizeClick);
            console.log('Summarize button event listener attached');
        } else {
            console.error('Summarize chat button not found in DOM');
        }
    }

    // Handle summarize click - SEPARATE FUNCTION FOR BETTER DEBUGGING
    function handleSummarizeClick() {
        console.log('=== SUMMARIZE BUTTON CLICKED ===');
        console.log('Current viewing call:', currentViewingCall);
        
        if (!currentViewingCall) {
            console.error('No call data available for summarization');
            alert('No conversation selected. Please view a conversation first.');
            return;
        }

        if (!currentViewingCall.conversation || currentViewingCall.conversation.length === 0) {
            console.error('No conversation data in call');
            alert('No conversation data found in this call.');
            return;
        }

        console.log('Call has conversation data, proceeding with report generation...');
        generateStructuredMedicalReport(currentViewingCall);
    }

    // Setup modal events - COMPLETELY REWRITTEN FOR BETTER RELIABILITY
    function setupModalEvents() {
        console.log('Setting up modal events...');
        
        // Close modal when clicking X - FIXED WITH BETTER EVENT HANDLING
        if (closeConversationModal) {
            // Remove any existing listeners first
            closeConversationModal.replaceWith(closeConversationModal.cloneNode(true));
            const newCloseBtn = document.getElementById('close-conversation-modal');
            
            newCloseBtn.addEventListener('click', function(e) {
                console.log('Close modal X button clicked - WORKING');
                e.preventDefault();
                e.stopPropagation();
                conversationModal.classList.remove('active');
            });
            console.log('Close button event listener attached successfully');
        } else {
            console.error('Close conversation modal button not found');
        }

        // Close modal when clicking outside - FIXED
        conversationModal.addEventListener('click', function(e) {
            console.log('Modal area clicked, target:', e.target, 'currentTarget:', e.currentTarget);
            if (e.target === conversationModal) {
                console.log('Modal background clicked - closing modal');
                conversationModal.classList.remove('active');
            }
        });

        // Close modal with Escape key - FIXED
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && conversationModal.classList.contains('active')) {
                console.log('Escape key pressed - closing modal');
                conversationModal.classList.remove('active');
            }
        });

        console.log('Modal events setup complete');
    }

    // Show conversation modal - IMPROVED WITH BETTER BUTTON SETUP
    function showConversationModal(call) {
        console.log('=== SHOWING CONVERSATION MODAL ===');
        currentViewingCall = call;
        conversationTranscript.innerHTML = '';
        
        // Add conversation messages
        call.conversation.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `conversation-message conversation-${message.type === 'system' ? 'system' : message.type === 'ai' ? 'ai' : 'user'}`;
            
            const senderDiv = document.createElement('div');
            senderDiv.className = 'conversation-sender';
            
            let icon = 'fas fa-user';
            if (message.type === 'ai') icon = 'fas fa-robot';
            if (message.type === 'system') icon = 'fas fa-info-circle';
            
            senderDiv.innerHTML = `<i class="${icon}"></i> ${message.sender} - ${new Date(message.timestamp).toLocaleTimeString()}`;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'conversation-text';
            textDiv.textContent = message.text;
            
            messageDiv.appendChild(senderDiv);
            messageDiv.appendChild(textDiv);
            conversationTranscript.appendChild(messageDiv);
        });
        
        conversationTranscript.scrollTop = conversationTranscript.scrollHeight;
        
        // RE-ATTACH EVENT LISTENER TO SUMMARIZE BUTTON (IMPORTANT FIX)
        if (summarizeChatBtn) {
            // Remove any existing listeners and reattach
            summarizeChatBtn.replaceWith(summarizeChatBtn.cloneNode(true));
            // Get the new button reference
            const newSummarizeBtn = document.getElementById('summarize-chat');
            if (newSummarizeBtn) {
                newSummarizeBtn.addEventListener('click', handleSummarizeClick);
                console.log('Summarize button event listener re-attached in modal');
            }
        }
        
        conversationModal.classList.add('active');
        console.log('Modal is now visible and ready');
    }

    // Call management functions
    function callStarted() {
        callActive = true;
        callStartTime = new Date();
        updateCallStatus("Call in progress...", "calling");
        startTimer();
        clearTranscript();
        
        addTranscriptMessage('System', 'Call started with MediVoice AI Assistant', 'system');
    }

    function callEnded() {
        callActive = false;
        updateCallStatus("Call ended", "offline");
        stopTimer();
        
        addTranscriptMessage('System', 'Call ended', 'system');
        
        saveCallToHistory();
    }

    function updateCallStatus(status, state) {
        callStatus.textContent = status;
        
        statusIndicator.className = 'status-indicator';
        if (state === 'online') {
            statusIndicator.classList.add('status-online');
        } else if (state === 'calling') {
            statusIndicator.classList.add('status-calling');
        } else {
            statusIndicator.classList.add('status-offline');
        }
    }

    // Timer functions
    function startTimer() {
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        timerElement.textContent = "00:00";
    }

    function updateTimer() {
        if (!callStartTime) return;
        
        const now = new Date();
        const diff = Math.floor((now - callStartTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Transcript functions
    function addTranscriptMessage(sender, text, type) {
        if (noTranscript.style.display !== 'none') {
            noTranscript.style.display = 'none';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        
        let icon = 'fas fa-user';
        if (type === 'ai') icon = 'fas fa-robot';
        if (type === 'system') icon = 'fas fa-info-circle';
        
        senderDiv.innerHTML = `<i class="${icon}"></i> ${sender}`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;
        
        messageDiv.appendChild(senderDiv);
        messageDiv.appendChild(textDiv);
        
        transcriptContainer.appendChild(messageDiv);
        transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
        
        // Store conversation data
        currentConversation.push({
            sender: sender,
            text: text,
            type: type,
            timestamp: new Date().toISOString()
        });

        console.log('Added message to conversation:', { sender, text, type });
    }

    function clearTranscript() {
        transcriptContainer.innerHTML = '';
        noTranscript.style.display = 'block';
        currentConversation = [];
        console.log('Transcript cleared');
    }

    // Call history functions
    function saveCallToHistory() {
        if (currentConversation.length === 0) {
            console.log('No conversation to save');
            return;
        }
        
        const callData = {
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            duration: timerElement.textContent,
            conversation: [...currentConversation]
        };
        
        callHistoryData.unshift(callData);
        if (callHistoryData.length > 10) {
            callHistoryData = callHistoryData.slice(0, 10);
        }
        
        localStorage.setItem('mediVoiceCallHistory', JSON.stringify(callHistoryData));
        renderCallHistory();
        console.log('Call saved to history');
    }

    function renderCallHistory() {
        if (callHistoryData.length === 0) {
            noHistory.style.display = 'block';
            callHistory.innerHTML = '';
            return;
        }
        
        noHistory.style.display = 'none';
        callHistory.innerHTML = '';
        
        callHistoryData.forEach(call => {
            const callItem = document.createElement('div');
            callItem.className = 'call-item';
            
            const callInfo = document.createElement('div');
            callInfo.className = 'call-info';
            
            const callTitle = document.createElement('h4');
            callTitle.textContent = `Call - ${call.date}`;
            
            const callDetails = document.createElement('p');
            callDetails.textContent = `Duration: ${call.duration} | Messages: ${call.conversation.filter(t => t.type !== 'system').length}`;
            
            callInfo.appendChild(callTitle);
            callInfo.appendChild(callDetails);
            
            const callActions = document.createElement('div');
            callActions.className = 'call-actions';
            
            // View Conversation button
            const viewConversationBtn = document.createElement('button');
            viewConversationBtn.className = 'action-btn';
            viewConversationBtn.innerHTML = '<i class="fas fa-comments"></i>';
            viewConversationBtn.title = 'View Full Conversation';
            viewConversationBtn.addEventListener('click', () => {
                console.log('View conversation button clicked for call:', call.id);
                showConversationModal(call);
            });
            
            // View Transcript button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'action-btn';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.title = 'View Transcript';
            viewBtn.addEventListener('click', () => viewCallTranscript(call));
            
            // Generate Report button
            const reportBtn = document.createElement('button');
            reportBtn.className = 'action-btn';
            reportBtn.innerHTML = '<i class="fas fa-file-medical-alt"></i>';
            reportBtn.title = 'Generate Report';
            reportBtn.addEventListener('click', () => generateReportFromCall(call));
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete Call';
            deleteBtn.addEventListener('click', () => deleteCall(call.id));
            
            callActions.appendChild(viewConversationBtn);
            callActions.appendChild(viewBtn);
            callActions.appendChild(reportBtn);
            callActions.appendChild(deleteBtn);
            
            callItem.appendChild(callInfo);
            callItem.appendChild(callActions);
            
            callHistory.appendChild(callItem);
        });
    }

    function viewCallTranscript(call) {
        clearTranscript();
        noTranscript.style.display = 'none';
        
        call.conversation.forEach(message => {
            addTranscriptMessage(message.sender, message.text, message.type);
        });
    }

    function deleteCall(callId) {
        if (confirm('Are you sure you want to delete this call from history?')) {
            callHistoryData = callHistoryData.filter(call => call.id !== callId);
            localStorage.setItem('mediVoiceCallHistory', JSON.stringify(callHistoryData));
            renderCallHistory();
        }
    }

    function clearHistory() {
        if (confirm('Are you sure you want to clear all call history?')) {
            callHistoryData = [];
            localStorage.setItem('mediVoiceCallHistory', JSON.stringify(callHistoryData));
            renderCallHistory();
        }
    }

    // Generate structured medical report using Gemini AI
    async function generateStructuredMedicalReport(call) {
        console.log('=== STARTING REPORT GENERATION ===');
        
        // Update button state immediately
        const summarizeBtn = document.getElementById('summarize-chat');
        if (summarizeBtn) {
            summarizeBtn.disabled = true;
            summarizeBtn.innerHTML = '<div class="loading"></div> Generating Report...';
        }
        
        try {
            // Format conversation for analysis
            const formattedConversation = call.conversation
                .filter(msg => msg.type === 'user' || msg.type === 'ai')
                .map(msg => `${msg.sender}: ${msg.text}`)
                .join('\n');
            
            console.log('Formatted conversation length:', formattedConversation.length);
            console.log('First 500 chars of conversation:', formattedConversation.substring(0, 500));
            
            if (!formattedConversation || formattedConversation.trim().length < 10) {
                throw new Error('Conversation too short for analysis (minimum 10 characters required)');
            }
            
            // Generate structured medical report using Gemini
            console.log('Calling Gemini API...');
            const structuredReport = await generateStructuredReportWithGemini(formattedConversation);
            console.log('Received structured report:', structuredReport);
            
            // Display the structured report
            displayStructuredReport(structuredReport, call);
            
            // Close modal and show report
            conversationModal.classList.remove('active');
            reportSection.style.display = 'block';
            reportSection.scrollIntoView({ behavior: 'smooth' });
            
            alert('Medical report generated successfully!');
            
        } catch (error) {
            console.error('Error generating structured report:', error);
            alert('Failed to generate report: ' + error.message);
        } finally {
            // Reset button state
            const summarizeBtn = document.getElementById('summarize-chat');
            if (summarizeBtn) {
                summarizeBtn.disabled = false;
                summarizeBtn.innerHTML = '<i class="fas fa-file-contract"></i> Summarize & Generate Report';
            }
        }
    }

    // Generate structured report using Gemini AI - FIXED API MODEL
    async function generateStructuredReportWithGemini(conversationText) {
        const prompt = `You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on the transcript, generate a structured report with the following fields:

sessionId: a unique session identifier
agent: the medical specialist name (e.g., "General Physician AI")
user: name of the patient or "Anonymous" if not provided
timestamp: current date and time in ISO format
chiefComplaint: one-sentence summary of the main health concern
summary: a 2-3 sentence summary of the conversation, symptoms, and recommendations
symptoms: list of symptoms mentioned by the user
duration: how long the user has experienced the symptoms
severity: mild, moderate, or severe
medicationsMentioned: list of any medicines mentioned
recommendations: list of AI suggestions (e.g., rest, see a doctor)

Return the result in this JSON format:
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "string",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"]
}

Only include valid fields. Respond with nothing else.

CONVERSATION TRANSCRIPT:
${conversationText}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1000,
            }
        };
        
        console.log('Sending request to Gemini API...');
        console.log('API URL:', GEMINI_API_URL);
        
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API response error:', response.status, errorText);
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]?.content?.parts[0]) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }
            
            const responseText = data.candidates[0].content.parts[0].text;
            console.log('Raw Gemini response:', responseText);
            
            // Parse JSON from response
            try {
                // Extract JSON from response (in case there's any extra text)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedJson = JSON.parse(jsonMatch[0]);
                    console.log('Parsed JSON report:', parsedJson);
                    return parsedJson;
                } else {
                    console.error('No JSON found in response:', responseText);
                    throw new Error('No JSON found in AI response');
                }
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                console.error('Response text that failed to parse:', responseText);
                throw new Error('Failed to parse AI response as JSON');
            }
        } catch (networkError) {
            console.error('Network error calling Gemini API:', networkError);
            throw new Error('Network error: ' + networkError.message);
        }
    }

    // Display structured report
    function displayStructuredReport(reportData, call) {
        console.log('Displaying structured report:', reportData);
        
        let reportHTML = `
            <div class="report-item">
                <h4><i class="fas fa-calendar-alt"></i> Consultation Date</h4>
                <p>${call.date}</p>
            </div>
            <div class="report-item">
                <h4><i class="fas fa-id-card"></i> Session ID</h4>
                <p>${reportData.sessionId || 'MED-' + new Date().getTime()}</p>
            </div>
            <div class="report-item">
                <h4><i class="fas fa-user-md"></i> Medical Specialist</h4>
                <p>${reportData.agent || 'General Physician AI'}</p>
            </div>
            <div class="report-item">
                <h4><i class="fas fa-user"></i> Patient</h4>
                <p>${reportData.user || 'Anonymous'}</p>
            </div>
            <div class="report-item">
                <h4><i class="fas fa-stethoscope"></i> Chief Complaint</h4>
                <p>${reportData.chiefComplaint || 'Not specified'}</p>
            </div>
            <div class="report-item">
                <h4><i class="fas fa-clipboard"></i> Summary</h4>
                <p>${reportData.summary || 'No summary available'}</p>
            </div>`;
        
        if (reportData.symptoms && reportData.symptoms.length > 0) {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-notes-medical"></i> Symptoms</h4>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        ${reportData.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                    </ul>
                </div>`;
        } else {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-notes-medical"></i> Symptoms</h4>
                    <p>No specific symptoms mentioned</p>
                </div>`;
        }
        
        if (reportData.duration) {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-clock"></i> Duration</h4>
                    <p>${reportData.duration}</p>
                </div>`;
        }
        
        if (reportData.severity) {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-exclamation-triangle"></i> Severity</h4>
                    <p>${reportData.severity}</p>
                </div>`;
        }
        
        if (reportData.medicationsMentioned && reportData.medicationsMentioned.length > 0) {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-pills"></i> Medications Mentioned</h4>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        ${reportData.medicationsMentioned.map(med => `<li>${med}</li>`).join('')}
                    </ul>
                </div>`;
        }
        
        if (reportData.recommendations && reportData.recommendations.length > 0) {
            reportHTML += `
                <div class="report-item">
                    <h4><i class="fas fa-heartbeat"></i> Recommendations</h4>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>`;
        }
        
        // Store the report data for PDF download
        window.currentReportData = {
            structured: reportData,
            call: call,
            html: reportHTML
        };
        
        reportContent.innerHTML = reportHTML;
        reportSection.style.display = 'block';
    }

    // Report generation functions
    async function generateReport() {
        console.log('Generating report from current conversation');
        
        if (currentConversation.length === 0) {
            alert('No conversation data available to generate a report. Please have a conversation first.');
            return;
        }
        
        const callData = {
            id: new Date().getTime(),
            date: new Date().toLocaleString(),
            duration: 'Current session',
            conversation: currentConversation
        };
        
        await generateStructuredMedicalReport(callData);
    }

    async function generateReportFromCall(call) {
        console.log('Generating report from call history:', call);
        await generateStructuredMedicalReport(call);
    }

    // Download report as PDF
    function downloadReport() {
        if (!window.currentReportData) {
            alert('No report available to download. Please generate a report first.');
            return;
        }
        
        const { structured, call, html } = window.currentReportData;
        
        // Create a printable version of the report
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Medical Consultation Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #0c4a6e; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #0c4a6e; margin-bottom: 10px; }
                    .report-section { margin-bottom: 25px; }
                    .report-section h3 { color: #0c4a6e; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
                    .report-item { margin-bottom: 15px; }
                    .report-item h4 { color: #0c4a6e; margin: 0 0 5px 0; font-size: 14px; }
                    .report-item p, .report-item ul { margin: 0; font-size: 13px; }
                    ul { padding-left: 20px; }
                    li { margin-bottom: 3px; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 20px; }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Medical Consultation Report</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="report-content">
                    ${html.replace(/<h4>/g, '<h3>').replace(/<\/h4>/g, '</h3>')}
                </div>
                
                <div class="footer">
                    <p><strong>Disclaimer:</strong> This report is generated by AI based on voice conversation and should not replace professional medical advice.</p>
                    <p>Session ID: ${structured.sessionId || 'MED-' + new Date().getTime()} | Consultation Date: ${call.date}</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #0c4a6e; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
                </div>
                
                <script>
                    // Auto-print after a short delay
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Make functions globally available for Vapi integration
    window.callStarted = callStarted;
    window.callEnded = callEnded;
    window.addTranscriptMessage = addTranscriptMessage;
    window.updateCallStatus = updateCallStatus;

    // Initialize the application
    window.addEventListener('DOMContentLoaded', initApp);
})();