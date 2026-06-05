"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if the consent cookie exists
        const consent = Cookies.get('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        // Set the cookie for 365 days
        Cookies.set('cookie-consent', 'true', { expires: 365 });
        setIsVisible(false);
    };

    const handleReject = () => {
        Cookies.set('cookie-consent', 'false', { expires: 365 });
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom-full">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                    <p>We use cookies to improve your experience on our site. By using our site, you consent to cookies.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReject}
                        className="whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleAccept}
                        className="whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    );
}