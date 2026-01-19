import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Endereço de email inválido');
const passwordSchema = z.string().min(8, 'A senha deve ter pelo menos 8 caracteres');

type AuthMode = 'login' | 'signup' | 'forgot-password';
type SignupType = 'student' | 'teacher';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword, user, isLoading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [signupType, setSignupType] = useState<SignupType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const validateForm = (): boolean => {
    setError(null);
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return false;
    }

    if (mode !== 'forgot-password') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        setError(passwordResult.error.errors[0].message);
        return false;
      }
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha inválidos');
          } else {
            setError(error.message);
          }
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, { name });
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Já existe uma conta com este email');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess(
            signupType === 'teacher'
              ? 'Conta criada! Verifique seu email para confirmar. Sua conta está pendente de aprovação do administrador.'
              : 'Conta criada! Verifique seu email para confirmar sua conta.'
          );
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Email de redefinição de senha enviado. Verifique sua caixa de entrada.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'signup' && 'Criar uma conta'}
            {mode === 'forgot-password' && 'Redefinir senha'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' && 'Entre com suas credenciais para acessar sua conta'}
            {mode === 'signup' && 'Preencha seus dados para começar'}
            {mode === 'forgot-password' && 'Digite seu email para receber um link de redefinição'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {mode === 'signup' && (
              <Tabs value={signupType} onValueChange={(v) => setSignupType(v as SignupType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="student">Aluno</TabsTrigger>
                  <TabsTrigger value="teacher">Professor</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && signupType === 'teacher' && (
              <Alert>
                <AlertDescription>
                  Contas de professor requerem aprovação do administrador antes que você possa acessar a plataforma.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' && 'Entrar'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'forgot-password' && 'Enviar link de redefinição'}
            </Button>

            <div className="text-sm text-center space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </button>
                  <p className="text-muted-foreground">
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline"
                    >
                      Cadastre-se
                    </button>
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <p className="text-muted-foreground">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              )}

              {mode === 'forgot-password' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline"
                >
                  Voltar ao login
                </button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
