import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipo para as preferências de notificação
interface NotificationPreferences {
  completed: boolean;
  failed: boolean;
  soundEnabled: boolean;
}

// Tipo para o contexto
interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (newPreferences: Partial<NotificationPreferences>) => void;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string, type: 'completed' | 'failed') => void;
  playSound: () => void;
  hasPermission: boolean;
}

// Som de notificação em base64 (beep curto)
const NOTIFICATION_SOUND_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2u2snBSV+zPLZeSsFJnvL8N2QQAoUXrTp66hVFApGn+H2u2snBSV+zPLZeSsFJ3vM8N6QQAoTXrPo66hWFAlEnuD2vGwnBSR7zPLYeisFJ3vM8N6QQAoTXrTp6qhXFAlEnuD3vGwnBSR7zfHYeisFJ3vM8N+RQAoTXrTp66pYEwlEnuH3vGsnBiR7zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAoTX7Tp66pYEwlFnuH3vGsnBiN8zfHYeyoGJnzN8N+RQAo=';

// Contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    completed: false,
    failed: false,
    soundEnabled: true,
  });
  
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Carregar preferências do localStorage ao montar
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notification_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (error) {
        console.error('Erro ao carregar preferências de notificação:', error);
      }
    }

    // Verificar permissões atuais
    checkPermission();

    // Criar elemento de áudio
    const audio = new Audio(NOTIFICATION_SOUND_BASE64);
    audio.preload = 'auto';
    setAudioElement(audio);
  }, []);

  // Verificar permissões atuais
  const checkPermission = () => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  // Solicitar permissão do browser
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // Atualizar preferências
  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('notification_preferences', JSON.stringify(updated));
  };

  // Reproduzir som de notificação
  const playSound = () => {
    if (preferences.soundEnabled && audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(error => {
        console.error('Erro ao reproduzir som:', error);
      });
    }
  };

  // Enviar notificação
  const sendNotification = (title: string, body: string, type: 'completed' | 'failed') => {
    // Verificar se deve enviar notificação baseado nas preferências
    if (!preferences[type]) {
      return;
    }

    // Reproduzir som se habilitado
    if (preferences.soundEnabled) {
      playSound();
    }

    // Enviar notificação do browser se tiver permissão
    if (hasPermission) {
      try {
        const notification = new Notification(title, {
          body,
          icon: type === 'completed' ? '/icons/success.png' : '/icons/error.png',
          badge: '/icons/badge.png',
          tag: `task-${type}`,
          requireInteraction: type === 'failed', // Notificações de erro ficam até serem clicadas
        });

        // Auto-fechar notificações de sucesso após 5 segundos
        if (type === 'completed') {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }

        // Opcional: adicionar evento de clique
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
      }
    }
  };

  const value: NotificationContextType = {
    preferences,
    updatePreferences,
    requestPermission,
    sendNotification,
    playSound,
    hasPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
}

// Exportar o contexto para uso direto se necessário
export { NotificationContext };