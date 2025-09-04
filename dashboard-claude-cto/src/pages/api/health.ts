import type { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import process from 'process';
import axios from 'axios';

// Variável para cache
let lastHealthCheck: {
  timestamp: number;
  result: any;
} | null = null;

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  // Verificar se o cache ainda é válido (menos de 5 segundos)
  if (lastHealthCheck && (Date.now() - lastHealthCheck.timestamp) < 5000) {
    return res.status(lastHealthCheck.result.status).json(lastHealthCheck.result.data);
  }

  try {
    // Verificar conectividade com a API do Claude CTO
    await axios.get('http://localhost:8888/health', { timeout: 3000 });

    // Preparar dados de health check
    const healthCheckData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      nextjsVersion: require('next/package.json').version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      uptime: process.uptime(),
    };

    // Armazenar no cache
    lastHealthCheck = {
      timestamp: Date.now(),
      result: {
        status: 200,
        data: healthCheckData
      }
    };

    // Retornar resposta de sucesso
    res.status(200).json(healthCheckData);
  } catch (error) {
    // Preparar dados de erro
    const errorData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    // Armazenar no cache
    lastHealthCheck = {
      timestamp: Date.now(),
      result: {
        status: 503,
        data: errorData
      }
    };

    // Retornar resposta de serviço indisponível
    res.status(503).json(errorData);
  }
}