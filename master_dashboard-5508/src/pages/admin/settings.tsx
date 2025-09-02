import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Stack } from '../../components/ui/Stack';
import { Grid } from '../../components/ui/Grid';
import { Badge } from '../../components/ui/Badge';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

interface Setting {
  id: string;
  category: string;
  label: string;
  value: string | boolean | number;
  type: 'text' | 'boolean' | 'number' | 'select';
  options?: { value: string; label: string }[];
  description?: string;
}

const SettingsPageContent: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([
    {
      id: 'api_url',
      category: 'API',
      label: 'URL da API',
      value: 'http://localhost:8888',
      type: 'text',
      description: 'Endereço do servidor da API Claude CTO'
    },
    {
      id: 'api_timeout',
      category: 'API',
      label: 'Timeout da API (ms)',
      value: 30000,
      type: 'number',
      description: 'Tempo máximo de espera para respostas da API'
    },
    {
      id: 'auto_refresh',
      category: 'Interface',
      label: 'Auto-atualização',
      value: true,
      type: 'boolean',
      description: 'Atualizar dados automaticamente'
    },
    {
      id: 'refresh_interval',
      category: 'Interface',
      label: 'Intervalo de Atualização (s)',
      value: 10,
      type: 'number',
      description: 'Frequência de atualização automática em segundos'
    },
    {
      id: 'theme',
      category: 'Interface',
      label: 'Tema',
      value: 'auto',
      type: 'select',
      options: [
        { value: 'light', label: 'Claro' },
        { value: 'dark', label: 'Escuro' },
        { value: 'auto', label: 'Automático' }
      ],
      description: 'Tema visual da interface'
    },
    {
      id: 'max_logs',
      category: 'Logs',
      label: 'Máximo de Logs',
      value: 200,
      type: 'number',
      description: 'Número máximo de logs mantidos em memória'
    },
    {
      id: 'log_level',
      category: 'Logs',
      label: 'Nível de Log',
      value: 'info',
      type: 'select',
      options: [
        { value: 'debug', label: 'Debug' },
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' }
      ],
      description: 'Nível mínimo de logs exibidos'
    },
    {
      id: 'enable_notifications',
      category: 'Notificações',
      label: 'Ativar Notificações',
      value: true,
      type: 'boolean',
      description: 'Receber notificações do sistema'
    },
    {
      id: 'notification_sound',
      category: 'Notificações',
      label: 'Som de Notificação',
      value: false,
      type: 'boolean',
      description: 'Tocar som ao receber notificações'
    }
  ]);

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Agrupar configurações por categoria
  const categories = Array.from(new Set(settings.map(s => s.category)));

  const handleSettingChange = (id: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setHasChanges(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Recarregar configurações do localStorage ou usar padrões
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setHasChanges(false);
    setMessage({ type: 'success', text: 'Configurações restauradas.' });
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-lg
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={setting.value as number}
            onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value))}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-lg
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value as boolean}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
              className="
                w-4 h-4
                text-blue-600
                bg-gray-100 dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                rounded
                focus:ring-blue-500 focus:ring-2
              "
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {setting.value ? 'Ativado' : 'Desativado'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="
              w-full px-3 py-2
              border border-gray-300 dark:border-gray-600
              rounded-lg
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações do sistema administrativo"
        actions={
          <Stack direction="horizontal" spacing="sm">
            {hasChanges && (
              <Badge variant="warning">
                Alterações não salvas
              </Badge>
            )}
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={saving || !hasChanges}
            >
              Resetar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
              }
            >
              Salvar Alterações
            </Button>
          </Stack>
        }
      />

      <Stack spacing="lg">
        {/* Mensagens */}
        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Configurações por Categoria */}
        {categories.map(category => (
          <Card key={category}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {category}
              </h3>
            </CardHeader>
            <CardBody>
              <Stack spacing="md">
                {settings
                  .filter(s => s.category === category)
                  .map(setting => (
                    <div key={setting.id}>
                      <Grid cols={1} colsMd={2} gap="md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div>
                          {renderSettingInput(setting)}
                        </div>
                      </Grid>
                    </div>
                  ))}
              </Stack>
            </CardBody>
          </Card>
        ))}

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações do Sistema
            </h3>
          </CardHeader>
          <CardBody>
            <Grid cols={1} colsMd={2} gap="md">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão do Dashboard</p>
                <p className="text-gray-900 dark:text-white">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Versão da API</p>
                <p className="text-gray-900 dark:text-white">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ambiente</p>
                <p className="text-gray-900 dark:text-white">Produção</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Atualização</p>
                <p className="text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
              </div>
            </Grid>
          </CardBody>
        </Card>

        {/* Ações Perigosas */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Zona de Perigo
            </h3>
          </CardHeader>
          <CardBody>
            <Stack spacing="md">
              <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                <Stack direction="horizontal" spacing="md" align="center" justify="between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Limpar Todos os Dados
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remove permanentemente todos os dados do cache local
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                        localStorage.clear();
                        sessionStorage.clear();
                        setMessage({ type: 'success', text: 'Dados locais limpos com sucesso.' });
                      }
                    }}
                  >
                    Limpar Dados
                  </Button>
                </Stack>
              </div>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </AdminLayout>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin>
        <SettingsPageContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default SettingsPage;