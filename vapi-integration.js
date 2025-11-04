// Vapi.ai configuration and integration
(function() {
    // Vapi.ai configuration
    const assistant = "bf3dd457-8236-4539-b956-c676b9009f87";
    const apiKey = "bf3dd457-8236-4539-b956-c676b9009f87";
    const buttonConfig = {
        color: "#0ea5e9",
        size: "large"
    };
    
    // Global Vapi instance
    window.vapiInstance = null;

    // Load Vapi script and initialize
    function loadVapiScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="vapiSDK"]')) {
                if (window.vapiSDK) {
                    initializeVapi();
                    resolve();
                }
                return;
            }

            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
            script.defer = true;
            script.async = true;
            
            script.onload = function() {
                console.log('Vapi script loaded successfully');
                initializeVapi();
                resolve();
            };
            
            script.onerror = function() {
                console.error('Failed to load Vapi script');
                reject(new Error('Failed to load Vapi script'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize Vapi instance
    function initializeVapi() {
        if (!window.vapiSDK) {
            console.error('Vapi SDK not available');
            return;
        }

        try {
            window.vapiInstance = window.vapiSDK.run({
                apiKey: apiKey,
                assistant: assistant,
                config: buttonConfig,
            });

            // Move Vapi button to our container
            const vapiBtn = document.querySelector('.vapi-call-button');
            if (vapiBtn && document.getElementById('vapi-button')) {
                document.getElementById('vapi-button').appendChild(vapiBtn);
            }

            // Set up Vapi event listeners
            if (window.vapiInstance) {
                window.vapiInstance.on('call-start', function() {
                    console.log('Vapi call started event received');
                    if (window.callStarted) {
                        window.callStarted();
                    }
                });

                window.vapiInstance.on('call-end', function() {
                    console.log('Vapi call ended event received');
                    if (window.callEnded) {
                        window.callEnded();
                    }
                });

                window.vapiInstance.on('message', function(message) {
                    console.log('Vapi message received:', message);
                    if (message.type === 'transcript' && message.transcript) {
                        console.log('AI transcript:', message.transcript);
                        if (window.addTranscriptMessage) {
                            window.addTranscriptMessage('AI Assistant', message.transcript, 'ai');
                        }
                    }
                });

                window.vapiInstance.on('user-speech-start', function() {
                    console.log('User started speaking');
                });

                window.vapiInstance.on('user-speech-end', function(utterance) {
                    console.log('User speech ended, utterance:', utterance);
                    if (utterance && window.addTranscriptMessage) {
                        console.log('Adding user message to transcript:', utterance);
                        window.addTranscriptMessage('You', utterance, 'user');
                    }
                });

                window.vapiInstance.on('error', function(error) {
                    console.error('Vapi error:', error);
                    if (window.updateCallStatus) {
                        window.updateCallStatus('Error: ' + error.message, 'offline');
                    }
                });

                console.log('Vapi initialized successfully with assistant:', assistant);
            }
        } catch (error) {
            console.error('Error initializing Vapi:', error);
        }
    }

    // Load Vapi when the page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadVapiScript);
    } else {
        loadVapiScript();
    }
})();