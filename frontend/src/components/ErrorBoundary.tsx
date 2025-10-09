// Error Boundary Component
// Captura errores de React y muestra UI de fallback

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error a servicio de monitoreo (ej: Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // En producción, enviar a Sentry
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
                <div>
                  <CardTitle>¡Oops! Algo salió mal</CardTitle>
                  <CardDescription>
                    Ha ocurrido un error inesperado en la aplicación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
                  <p className="text-sm font-mono text-red-600 font-semibold mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600">
                No te preocupes, puedes intentar recargar la página o volver al inicio.
                Si el problema persiste, contacta a soporte.
              </p>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="flex-1"
              >
                <RefreshCcw className="size-4 mr-2" />
                Reintentar
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="size-4 mr-2" />
                Ir al Inicio
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook alternativo para componentes funcionales
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}



