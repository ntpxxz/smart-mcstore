import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-slate-200/60 rounded-md ${className}`} />
    );
};

export const TableSkeleton = () => {
    return (
        <div className="space-y-4 w-full">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 px-6 border-b border-slate-100">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
