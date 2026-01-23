import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/95 backdrop-blur-lg border-b shadow-soft' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <span className="text-primary-foreground font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Pole Agenda
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#funcionalidades" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </a>
            <a 
              href="#depoimentos" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Depoimentos
            </a>
            <a 
              href="#precos" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Preços
            </a>
            <Link 
              to="/teachers" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Encontrar Professoras
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="shadow-sm">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t bg-background animate-fade-in">
            <nav className="flex flex-col gap-1">
              <a 
                href="#funcionalidades" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funcionalidades
              </a>
              <a 
                href="#depoimentos" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Depoimentos
              </a>
              <a 
                href="#precos" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preços
              </a>
              <Link 
                to="/teachers" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3 py-2.5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Encontrar Professoras
              </Link>
              
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
