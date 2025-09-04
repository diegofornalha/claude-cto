import React from 'react';
import { Button } from './Button';
import { Skeleton, SkeletonCard } from './Skeleton';

// Error State Components
export interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente.",
  icon,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );

  return (
    <div className={`text-center py-16 px-6 animate-fade-in ${className}`}>
      {icon || defaultIcon}
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="inline-flex items-center border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Empty State Component
export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Nenhum item encontrado",
  message = "Não há dados para exibir no momento.",
  icon,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );

  return (
    <div className={`text-center py-16 px-6 animate-fade-in ${className}`}>
      {icon || defaultIcon}
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Loading State Component
export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Carregando...",
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  return (
    <div className={`text-center ${containerClasses[size]} px-6 animate-fade-in ${className}`}>
      <div className="flex items-center justify-center mb-6">
        <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}></div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        {message}
      </p>
    </div>
  );
};

// Enhanced Skeleton for Task Cards
export interface SkeletonTaskCardProps {
  className?: string;
  index?: number;
}

export const SkeletonTaskCard: React.FC<SkeletonTaskCardProps> = ({ 
  className = '',
  index = 0
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton variant="rectangular" width={20} height={20} className="rounded mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" height="20px" animation="wave" />
              <div className="flex items-center gap-2">
                <Skeleton variant="text" width="80px" height="14px" animation="wave" />
                <Skeleton variant="text" width="120px" height="14px" animation="wave" />
              </div>
            </div>
          </div>
          <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" animation="wave" />
        </div>
        
        {/* Content */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <Skeleton variant="text" width="100%" height="14px" animation="wave" />
          <Skeleton variant="text" width="90%" height="14px" animation="wave" />
          <Skeleton variant="text" width="75%" height="14px" animation="wave" />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Skeleton variant="text" width="120px" height="12px" animation="wave" />
            <Skeleton variant="text" width="130px" height="12px" animation="wave" />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={50} height={28} className="rounded" animation="wave" />
            <Skeleton variant="rectangular" width={60} height={28} className="rounded" animation="wave" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Progressive Loading Skeleton for complex layouts
export interface ProgressiveSkeletonProps {
  steps: number;
  currentStep: number;
  className?: string;
}

export const ProgressiveSkeleton: React.FC<ProgressiveSkeletonProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="200px" height="24px" animation="wave" />
        <div className="flex items-center gap-2">
          {Array.from({ length: steps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: Math.min(currentStep + 1, 6) }).map((_, i) => (
          <SkeletonTaskCard key={i} index={i} />
        ))}
      </div>
    </div>
  );
};

// Staggered loading animation for lists
export interface StaggeredSkeletonProps {
  count: number;
  delay?: number;
  className?: string;
  renderItem?: (index: number) => React.ReactNode;
}

export const StaggeredSkeleton: React.FC<StaggeredSkeletonProps> = ({
  count,
  delay = 100,
  className = '',
  renderItem
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{
            animationDelay: `${i * delay}ms`
          }}
        >
          {renderItem ? renderItem(i) : <SkeletonCard lines={2} />}
        </div>
      ))}
    </div>
  );
};

// Connection Status Indicator
export interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate?: Date;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastUpdate,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {isConnected ? 'Conectado' : 'Desconectado'}
        {lastUpdate && (
          <span className="ml-1">
            • {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        )}
      </span>
    </div>
  );
};