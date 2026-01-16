import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const styles = {
        success: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-800',
            icon: <CheckCircle className="text-emerald-500" size={20} />,
            progress: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            text: 'text-rose-800',
            icon: <XCircle className="text-rose-500" size={20} />,
            progress: 'bg-rose-500'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-800',
            icon: <AlertCircle className="text-blue-500" size={20} />,
            progress: 'bg-blue-500'
        }
    };

    const currentStyle = styles[type];

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] toast-container">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl ${currentStyle.bg} ${currentStyle.border} min-w-[320px] relative overflow-hidden`}>
                <div className="flex-shrink-0">
                    {currentStyle.icon}
                </div>
                <div className={`flex-1 text-sm font-semibold ${currentStyle.text}`}>
                    {message}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X size={16} />
                </button>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5">
                    <div
                        className={`h-full ${currentStyle.progress} progress-bar`}
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>
            </div>

            <style jsx>{`
                .toast-container {
                    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .progress-bar {
                    width: 100%;
                    animation: progress linear forwards;
                }

                @keyframes slideDown {
                    from {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }

                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default Toast;
