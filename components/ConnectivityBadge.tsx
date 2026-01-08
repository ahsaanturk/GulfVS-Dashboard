
import React, { useState, useEffect } from 'react';
import { db } from '../db';

const ConnectivityBadge: React.FC = () => {
    const [isOnline, setIsOnline] = useState(db.getRemoteStatus());

    useEffect(() => {
        // Subscribe to status changes
        const unsubscribe = db.onStatusChange((status) => {
            setIsOnline(status);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-500">
            <div className={`
        flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-300
        ${isOnline
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'}
      `}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {isOnline ? 'Cloud Synced' : 'Local Mode'}
                </span>
            </div>
        </div>
    );
};

export default ConnectivityBadge;
