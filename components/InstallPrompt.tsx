import React, { useEffect, useState } from 'react';

interface InstallPromptProps {
    deferredPrompt: any;
    onInstall: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ deferredPrompt, onInstall }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Initial check
        if (deferredPrompt) {
            const timer = setTimeout(() => setShow(true), 2000); // Slight delay on load
            return () => clearTimeout(timer);
        }
    }, [deferredPrompt]);

    useEffect(() => {
        // Re-show every 30 seconds if prompt exists and not currently visible
        const interval = setInterval(() => {
            if (deferredPrompt && !show) {
                setShow(true);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [deferredPrompt, show]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            onInstall(); // Clear prompt from state
            setShow(false);
        }
    };

    if (!show || !deferredPrompt) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-accent to-orange-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20 transform rotate-3">
                        <span className="text-3xl">📲</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Install App</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                        Install <span className="text-accent font-bold">GulfVS Dashboard</span> for the best experience. Works offline and syncs automatically!
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setShow(false)}
                            className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex-1 py-3 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-accent/30 hover:scale-105 transition-transform"
                        >
                            Install Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
