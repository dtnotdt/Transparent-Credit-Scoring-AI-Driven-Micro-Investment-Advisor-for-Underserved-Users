import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ComplianceBanner: React.FC = () => {
  return (
    <div className="w-full bg-amber-50 border-y border-amber-200 px-4 py-2 text-black text-xs sm:text-sm flex items-center justify-center gap-2 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="font-medium text-center">
        This application is for educational purposes only and does not provide regulated financial or investment advice.
      </span>
    </div>
  );
};
