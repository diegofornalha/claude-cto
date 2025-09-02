import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export interface NotificationPreferences {
  task_completed: boolean;
  task_failed: boolean;
  system_alerts: boolean;
}

export interface NotificationSettingsProps {
  className?: string;
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

const defaultPreferences: NotificationPreferences = {
  task_completed: true,
  task_failed: true,
  system_alerts: true,
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onPreferencesChange
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    // Carrega preferências do localStorage
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Erro ao carregar preferências de notificação:', error);
      }
    }

    // Verifica o status atual da permissão
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const savePreferences = (newPreferences: NotificationPreferences) => {
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    onPreferencesChange?.(newPreferences);
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações');
      return;
    }

    setIsRequesting(true);
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const sendTestNotification = () => {
    if (permission !== 'granted') {
      alert('Permissão de notificação não foi concedida');
      return;
    }

    new Notification('Notificação de Teste', {
      body: 'Esta é uma notificação de teste do Claude CTO Dashboard',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { type: 'success' as const, message: 'Permissão concedida' };
      case 'denied':
        return { type: 'error' as const, message: 'Permissão negada' };
      default:
        return { type: 'warning' as const, message: 'Permissão não solicitada' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Card className={`max-w-2xl ${className}`}>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Configurações de Notificação
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure suas preferências de notificação para acompanhar o status das tarefas
        </p>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Status da Permissão */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Status da Permissão do Navegador
          </h3>
          
          <Alert severity={permissionStatus.type} icon={true}>
            {permissionStatus.message}
          </Alert>

          {permission !== 'granted' && (
            <Button
              variant="primary"
              size="sm"
              onClick={requestPermission}
              loading={isRequesting}
              disabled={permission === 'denied'}
            >
              {permission === 'denied' 
                ? 'Permissão Negada - Habilite nas Configurações do Navegador' 
                : 'Solicitar Permissão'
              }
            </Button>
          )}
        </div>

        {/* Preferências de Notificação */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Tipos de Notificação
          </h3>
          
          <div className="space-y-3">
            {/* Task Completed */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Tarefas Concluídas
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Notificar quando uma tarefa for concluída com sucesso
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.task_completed}
                  onChange={(e) => handlePreferenceChange('task_completed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Task Failed */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Tarefas Falhadas
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Notificar quando uma tarefa falhar ou encontrar erro
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.task_failed}
                  onChange={(e) => handlePreferenceChange('task_failed', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* System Alerts */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Alertas do Sistema
                </label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Notificar sobre alertas críticos do sistema
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.system_alerts}
                  onChange={(e) => handlePreferenceChange('system_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="secondary"
            size="md"
            onClick={sendTestNotification}
            disabled={permission !== 'granted'}
            className="flex-1 sm:flex-none"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.002 7.002 0 00-7-7H3v2h5a5 5 0 015 5v5z" />
            </svg>
            Testar Notificação
          </Button>
          
          {testNotificationSent && (
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Notificação enviada!
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;