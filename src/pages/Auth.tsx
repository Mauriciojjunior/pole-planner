import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
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
    } catch {
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-hero">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow animate-pulse-glow">
            <span className="text-white font-display font-bold text-2xl">P</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-hero">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
            <span className="text-white font-display font-bold text-lg">P</span>
          </div>
          <span className="font-display text-xl font-bold text-gradient">Pole Planner</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass-card border-border/30">
            <CardHeader className="space-y-2 text-center pb-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-2">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl font-bold">
                {mode === 'login' && 'Bem-vinda de volta'}
                {mode === 'signup' && 'Criar uma conta'}
                {mode === 'forgot-password' && 'Redefinir senha'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' && 'Entre com suas credenciais para acessar sua conta'}
                {mode === 'signup' && 'Preencha seus dados para começar sua jornada'}
                {mode === 'forgot-password' && 'Digite seu email para receber um link de redefinição'}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-primary/30 bg-primary/5 animate-fade-in">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground">{success}</AlertDescription>
                  </Alert>
                )}

                {mode === 'signup' && (
                  <Tabs value={signupType} onValueChange={(v) => setSignupType(v as SignupType)}>
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                      <TabsTrigger value="student" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Aluna
                      </TabsTrigger>
                      <TabsTrigger value="teacher" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Professora
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Maria Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-background/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background/50"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-background/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && signupType === 'teacher' && (
                  <Alert className="border-gold/30 bg-gold/5">
                    <Sparkles className="h-4 w-4 text-gold" />
                    <AlertDescription className="text-foreground">
                      Contas de professora requerem aprovação do administrador antes que você possa acessar a plataforma.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="gradient"
                  size="lg"
                  disabled={isLoading}
                >
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
                        className="text-primary hover:underline transition-colors"
                      >
                        Esqueceu sua senha?
                      </button>
                      <p className="text-muted-foreground">
                        Não tem uma conta?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="text-primary hover:underline font-medium transition-colors"
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
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Entrar
                      </button>
                    </p>
                  )}

                  {mode === 'forgot-password' && (
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary hover:underline transition-colors"
                    >
                      Voltar ao login
                    </button>
                  )}
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pole Planner. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
