// Página de configurações de notificações
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Bell,
  ArrowLeft,
  Volume2,
  Monitor,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  TestTube
} from 'lucide-react';
import { McpApi, NotificationSettings } from '../../services/mcp-api';

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: false,
    desktop: true,
    email: false,
    events: {
      task_completed: true,
      task_failed: true,
      system_alerts: true,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  // Carregar configurações e verificar permissões
  useEffect(() => {
    loadSettings();
    checkDesktopPermission();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await McpApi.getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const checkDesktopPermission = () => {
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  };

  const requestDesktopPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, desktop: true }));
        setMessage({ type: 'success', text: 'Permissão para notificações desktop concedida!' });
      } else {
        setSettings(prev => ({ ...prev, desktop: false }));
        setMessage({ type: 'error', text: 'Permissão para notificações desktop negada' });
      }
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const success = await McpApi.updateNotificationSettings(settings);
      
      if (success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        
        // Salvar também no localStorage para uso pelo WebSocket
        localStorage.setItem('notification_settings', JSON.stringify(settings));
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      setMessage({ type: 'error', text: 'Notificações não são suportadas neste navegador' });
      return;
    }

    if (Notification.permission !== 'granted') {
      setMessage({ type: 'error', text: 'Permissão para notificações não concedida' });
      return;
    }

    // Criar notificação de teste
    const notification = new Notification('Claude CTO Monitor', {
      body: 'Esta é uma notificação de teste! 🚀',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
      requireInteraction: false,
    });

    // Tocar som se habilitado
    if (settings.sound) {
      // Usar Web Audio API para criar um som simples
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequência do som
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Erro ao tocar som:', e);
      }
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setMessage({ type: 'success', text: 'Notificação de teste enviada!' });
  };

  const handleToggle = (field: keyof NotificationSettings) => {
    if (field === 'events') return;
    
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEventToggle = (event: keyof NotificationSettings['events']) => {
    setSettings(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [event]: !prev.events[event]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/monitor')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <Bell className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Configurações de Notificação
              </h1>
            </div>
            
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Carregando configurações...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configurações Gerais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Configurações Gerais
              </h2>
              
              <div className="space-y-4">
                {/* Notificações Habilitadas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações Habilitadas</p>
                      <p className="text-sm text-gray-600">Ativar ou desativar todas as notificações</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('enabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Som */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Volume2 className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Som de Notificação</p>
                      <p className="text-sm text-gray-600">Tocar som quando receber notificações</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('sound')}
                    disabled={!settings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.sound && settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Desktop */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Monitor className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações Desktop</p>
                      <p className="text-sm text-gray-600">
                        Mostrar notificações do sistema
                        {desktopPermission === 'granted' && (
                          <span className="ml-2 text-green-600">(Permitido)</span>
                        )}
                        {desktopPermission === 'denied' && (
                          <span className="ml-2 text-red-600">(Bloqueado)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {desktopPermission === 'default' ? (
                    <button
                      onClick={requestDesktopPermission}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Permitir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggle('desktop')}
                      disabled={!settings.enabled || desktopPermission === 'denied'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.desktop && settings.enabled && desktopPermission === 'granted' 
                          ? 'bg-indigo-600' : 'bg-gray-300'
                      } ${!settings.enabled || desktopPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.desktop ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  )}
                </div>

                {/* Email (Futuro) */}
                <div className="flex items-center justify-between opacity-50">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações por Email</p>
                      <p className="text-sm text-gray-600">Em breve - Receber notificações por email</p>
                    </div>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 cursor-not-allowed"
                  >
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tipos de Eventos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tipos de Eventos
              </h2>
              
              <div className="space-y-4">
                {/* Tarefas Concluídas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Tarefas Concluídas</p>
                      <p className="text-sm text-gray-600">Notificar quando tarefas forem concluídas com sucesso</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventToggle('task_completed')}
                    disabled={!settings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.events.task_completed && settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.events.task_completed ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Tarefas com Falha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Tarefas com Falha</p>
                      <p className="text-sm text-gray-600">Notificar quando tarefas falharem</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventToggle('task_failed')}
                    disabled={!settings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.events.task_failed && settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.events.task_failed ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Alertas do Sistema */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Alertas do Sistema</p>
                      <p className="text-sm text-gray-600">Notificar sobre eventos importantes do sistema</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventToggle('system_alerts')}
                    disabled={!settings.enabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.events.system_alerts && settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    } ${!settings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.events.system_alerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between">
              <button
                onClick={testNotification}
                disabled={!settings.enabled || !settings.desktop || desktopPermission !== 'granted'}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  settings.enabled && settings.desktop && desktopPermission === 'granted'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <TestTube className="h-5 w-5 mr-2" />
                Testar Notificação
              </button>
              
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;