import React from 'react';

const PredictionBadge = ({ isPresent }) => {
    const className = `prediction-badge ${isPresent ? 'present' : 'absent'}`;
    const text = isPresent ? 'PRESENT' : 'ABSENT';
    
    return <span className={className}>{text}</span>;
};

export default PredictionBadge;