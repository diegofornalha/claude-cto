import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Stack } from '@/components/ui/Stack';
import { Alert } from '@/components/ui/Alert';

interface Settings {
  api: {
    baseUrl: string;
    timeout: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    itemsPerPage: number;
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: string;
    events: {
      taskCompleted: boolean;
      taskFailed: boolean;
      systemAlerts: boolean;
    };
  };
  tasks: {
    defaultModel: 'opus' | 'sonnet' | 'haiku';
    defaultTimeout: number;
    autoRetry: boolean;
    maxRetries: number;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    api: {
      baseUrl: 'http://localhost:8888',
      timeout: 30000,
      autoRefresh: true,
      refreshInterval: 5000
    },
    ui: {
      theme: 'system',
      language: 'pt-BR',
      dateFormat: 'DD/MM/YYYY',
      itemsPerPage: 20
    },
    notifications: {
      enabled: true,
      sound: false,
      desktop: true,
      email: '',
      events: {
        taskCompleted: true,
        taskFailed: true,
        systemAlerts: true
      }
    },
    tasks: {
      defaultModel: 'opus',
      defaultTimeout: 600000,
      autoRetry: false,
      maxRetries: 3
    }
  });

  const [activeTab, setActiveTab] = useState<'api' | 'ui' | 'notifications' | 'tasks'>('api');
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }
  }, []);

  // Save settings
  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm('Resetar todas as configurações para os valores padrão?')) {
      localStorage.removeItem('appSettings');
      window.location.reload();
    }
  };

  // Update nested settings
  const updateSettings = (category: keyof Settings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateNotificationEvents = (event: keyof Settings['notifications']['events'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        events: {
          ...prev.notifications.events,
          [event]: value
        }
      }
    }));
  };

  const tabs = [
    { id: 'api', label: 'API' },
    { id: 'ui', label: 'Interface' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'tasks', label: 'Tasks' }
  ];

  return (
    <PageLayout>
      <PageHeader
        title="Configurações"
        description="Personalize o comportamento do sistema"
        actions={
          <Stack direction="horizontal" spacing="sm">
            <Button variant="outline" onClick={handleReset}>
              Resetar Padrões
            </Button>
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </Stack>
        }
      />

      {saved && (
        <Alert severity="success" className="mb-6">
          Configurações salvas com sucesso!
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="p-2">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                      flex items-center gap-3
                      ${activeTab === tab.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardBody>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* API Settings */}
          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Configurações da API</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Base da API
                  </label>
                  <Input
                    value={settings.api.baseUrl}
                    onChange={(e) => updateSettings('api', 'baseUrl', e.target.value)}
                    placeholder="http://localhost:8888"
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-gray-500">URL do servidor Claude CTO</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeout (ms)
                  </label>
                  <Input
                    type="number"
                    value={settings.api.timeout}
                    onChange={(e) => updateSettings('api', 'timeout', parseInt(e.target.value))}
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-gray-500">Tempo máximo de espera para requisições</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-refresh
                    </label>
                    <p className="text-sm text-gray-500">Atualizar dados automaticamente</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.api.autoRefresh}
                      onChange={(e) => updateSettings('api', 'autoRefresh', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.api.autoRefresh && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intervalo de Atualização (ms)
                    </label>
                    <Select
                      value={settings.api.refreshInterval.toString()}
                      onChange={(e) => updateSettings('api', 'refreshInterval', parseInt(e.target.value))}
                      options={[
                        { value: '3000', label: '3 segundos' },
                        { value: '5000', label: '5 segundos' },
                        { value: '10000', label: '10 segundos' },
                        { value: '30000', label: '30 segundos' },
                        { value: '60000', label: '1 minuto' }
                      ]}
                      fullWidth
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* UI Settings */}
          {activeTab === 'ui' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Configurações de Interface</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tema
                  </label>
                  <Select
                    value={settings.ui.theme}
                    onChange={(e) => updateSettings('ui', 'theme', e.target.value)}
                    options={[
                      { value: 'light', label: 'Claro' },
                      { value: 'dark', label: 'Escuro' },
                      { value: 'system', label: 'Sistema' }
                    ]}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma
                  </label>
                  <Select
                    value={settings.ui.language}
                    onChange={(e) => updateSettings('ui', 'language', e.target.value)}
                    options={[
                      { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
                      { value: 'en-US', label: '🇺🇸 English (US)' },
                      { value: 'es-ES', label: '🇪🇸 Español' }
                    ]}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Formato de Data
                  </label>
                  <Select
                    value={settings.ui.dateFormat}
                    onChange={(e) => updateSettings('ui', 'dateFormat', e.target.value)}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                    ]}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Itens por Página
                  </label>
                  <Select
                    value={settings.ui.itemsPerPage.toString()}
                    onChange={(e) => updateSettings('ui', 'itemsPerPage', parseInt(e.target.value))}
                    options={[
                      { value: '10', label: '10 itens' },
                      { value: '20', label: '20 itens' },
                      { value: '50', label: '50 itens' },
                      { value: '100', label: '100 itens' }
                    ]}
                    fullWidth
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Configurações de Notificações</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notificações Ativas
                      </label>
                      <p className="text-sm text-gray-500">Receber notificações do sistema</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enabled}
                        onChange={(e) => updateSettings('notifications', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {settings.notifications.enabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Som de Notificação
                          </label>
                          <p className="text-sm text-gray-500">Tocar som ao receber notificações</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.sound}
                            onChange={(e) => updateSettings('notifications', 'sound', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Notificações Desktop
                          </label>
                          <p className="text-sm text-gray-500">Mostrar notificações do sistema</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.desktop}
                            onChange={(e) => updateSettings('notifications', 'desktop', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email para Notificações
                        </label>
                        <Input
                          type="email"
                          value={settings.notifications.email}
                          onChange={(e) => updateSettings('notifications', 'email', e.target.value)}
                          placeholder="seu@email.com"
                          fullWidth
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Eventos de Notificação
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.notifications.events.taskCompleted}
                              onChange={(e) => updateNotificationEvents('taskCompleted', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Task Concluída
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.notifications.events.taskFailed}
                              onChange={(e) => updateNotificationEvents('taskFailed', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Task Falhada
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.notifications.events.systemAlerts}
                              onChange={(e) => updateNotificationEvents('systemAlerts', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              Alertas do Sistema
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Task Settings */}
          {activeTab === 'tasks' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Configurações de Tasks</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modelo Padrão
                  </label>
                  <Select
                    value={settings.tasks.defaultModel}
                    onChange={(e) => updateSettings('tasks', 'defaultModel', e.target.value)}
                    options={[
                      { value: 'opus', label: '🎭 Opus (Mais Poderoso)' },
                      { value: 'sonnet', label: '📝 Sonnet (Balanceado)' },
                      { value: 'haiku', label: '🌸 Haiku (Mais Rápido)' }
                    ]}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeout Padrão (ms)
                  </label>
                  <Input
                    type="number"
                    value={settings.tasks.defaultTimeout}
                    onChange={(e) => updateSettings('tasks', 'defaultTimeout', parseInt(e.target.value))}
                    fullWidth
                  />
                  <p className="mt-1 text-sm text-gray-500">Tempo máximo de execução para tasks</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Retry Automático
                    </label>
                    <p className="text-sm text-gray-500">Tentar novamente tasks que falharam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.tasks.autoRetry}
                      onChange={(e) => updateSettings('tasks', 'autoRetry', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.tasks.autoRetry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de Tentativas
                    </label>
                    <Select
                      value={settings.tasks.maxRetries.toString()}
                      onChange={(e) => updateSettings('tasks', 'maxRetries', parseInt(e.target.value))}
                      options={[
                        { value: '1', label: '1 tentativa' },
                        { value: '2', label: '2 tentativas' },
                        { value: '3', label: '3 tentativas' },
                        { value: '5', label: '5 tentativas' }
                      ]}
                      fullWidth
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <span className="text-gray-600 hover:text-gray-500 cursor-pointer">
            ← Voltar para Home
          </span>
        </Link>
        <Link href="/sitemap">
          <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
            🗺️ Sitemap
          </span>
        </Link>
      </div>
    </PageLayout>
  );
}