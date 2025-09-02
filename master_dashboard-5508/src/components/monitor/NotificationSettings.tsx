import React from 'react';
import { 
  Bell, 
  Volume2, 
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { settings, updateSettings } = useNotifications();

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <Card className="w-full max-w-md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-indigo-600" />
            Configurações de Notificação
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Configurações Gerais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Notificações Ativadas
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ativa ou desativa todas as notificações
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Som de Notificação
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Toca um som quando receber notificações
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('soundEnabled')}
              disabled={!settings.enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled && settings.enabled 
                  ? 'bg-indigo-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Notificações Desktop
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Mostra notificações do sistema
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle('desktopEnabled')}
              disabled={!settings.enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.desktopEnabled && settings.enabled 
                  ? 'bg-indigo-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.desktopEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Tipos de Notificação
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Tarefas Concluídas
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Notifica quando tarefas são concluídas
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('taskCompleted')}
                disabled={!settings.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.taskCompleted && settings.enabled 
                    ? 'bg-indigo-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.taskCompleted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Falhas em Tarefas
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Notifica quando tarefas falham
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('taskFailed')}
                disabled={!settings.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.taskFailed && settings.enabled 
                    ? 'bg-indigo-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.taskFailed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Alertas do Sistema
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Notifica sobre problemas do sistema
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('systemAlerts')}
                disabled={!settings.enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.systemAlerts && settings.enabled 
                    ? 'bg-indigo-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.systemAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;