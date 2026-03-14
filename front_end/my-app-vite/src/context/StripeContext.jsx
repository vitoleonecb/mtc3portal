import React, { createContext, useContext, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const StripeContext = createContext(null);

export function useStripePromise() {
    return useContext(StripeContext);
}

/**
 * Wrap your payment pages in <StripeProvider> to get access to
 * the shared stripe promise. When you have a clientSecret from
 * the backend, wrap the payment form in <Elements>.
 */
export function StripeProvider({ children }) {
    const stripePromise = useMemo(
        () => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
        []
    );

    return (
        <StripeContext.Provider value={stripePromise}>
            {children}
        </StripeContext.Provider>
    );
}

/**
 * Convenience wrapper that pairs <Elements> with the shared
 * stripe promise and a clientSecret.
 */
export function StripeElements({ clientSecret, children }) {
    const stripePromise = useStripePromise();

    if (!clientSecret) return null;

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#000000',
            colorIconTabMore: '#000000',
            tabIconColor: '#000000',
            tabIconSelectedColor: '#ffffff',
            colorBackground: '#ffffff',
            colorText: '#000000',
            colorDanger: '#ff4444',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            fontWeightNormal: '300',
            fontSizeBase: '0.9rem',
            borderRadius: '20px',
            spacingUnit: '4px',
        },
        rules: {
            '.Input': {
                border: '1px solid black',
                borderRadius: '20px',
                boxShadow: '-4px 4px black',
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                transition: 'box-shadow 0.2s ease',
            },
            '.Input:focus': {
                boxShadow: 'none',
                borderColor: 'black',
            },
            '.Input:hover': {
                boxShadow: '-2px 2px black',
            },
            '.Label': {
                color: '#000000',
                fontWeight: '400',
                fontSize: '0.9rem',
            },
            '.Tab, .Block, .AccordionItem, .PickerItem': {
                border: '1px solid black',
                borderRadius: '20px',
                boxShadow: '-4px 4px black',
                backgroundColor: '#ffffff',
                color: '#000000',
                transition: 'box-shadow 0.2s ease',
            },
            '.Tab:hover, .Block:hover, .AccordionItem:hover, .PickerItem:hover': {
                backgroundColor: '#000000',
                color: '#ffffff',
                boxShadow: 'none',
                transition: 'background-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease',
            },
            '.Tab--selected, .AccordionItem--selected, .PickerItem--selected': {
                backgroundColor: '#000000',
                color: '#ffffff',
                boxShadow: 'none',
                borderColor: '#000000',
            },
            '.Tab--selected:hover, .AccordionItem--selected:hover, .PickerItem--selected:hover': {
                backgroundColor: '#000000',
                color: '#ffffff',
            },
            '.Tab:focus, .Block:focus, .AccordionItem:focus, .PickerItem:focus': {
                boxShadow: 'none',
                outline: 'none',
            },
            '.Tab--selected:focus, .AccordionItem--selected:focus, .PickerItem--selected:focus': {
                boxShadow: 'none',
                outline: 'none',
            },
            '.TabIcon--selected': {
                color: '#ffffff',
                fill: '#ffffff',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            {children}
        </Elements>
    );
}
