import React from 'react';
import { EnhancedRandomTripProvider } from '../context/EnhancedRandomTripContext';
import EnhancedRandomTrip from '../components/enhanced-random/EnhancedRandomTrip';

const EnhancedRandomTripPage = () => {
    return (
        <EnhancedRandomTripProvider>
            <div className="container mx-auto p-4">
                <EnhancedRandomTrip />
            </div>
        </EnhancedRandomTripProvider>
    );
};

export default EnhancedRandomTripPage;
