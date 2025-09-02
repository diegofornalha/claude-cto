import React from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { SystemLogs } from '../../components/admin/SystemLogs';
import { Stack } from '../../components/ui/Stack';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

const SystemLogsPageContent: React.FC = () => {
  return (
    <AdminLayout>
      <PageHeader
        title="System Logs"
        description="Visualização em tempo real dos logs do sistema e eventos de auditoria"
      />

      <Stack spacing="lg">
        <SystemLogs maxEntries={200} autoScroll />
      </Stack>
    </AdminLayout>
  );
};

const SystemLogsPage: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin>
        <SystemLogsPageContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default SystemLogsPage;