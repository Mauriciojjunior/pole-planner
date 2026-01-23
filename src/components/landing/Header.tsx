import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
              <span className="text-white font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display text-xl font-bold text-gradient">Pole Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
              Funcionalidades
            </a>
            <a href="#depoimentos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
              Depoimentos
            </a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
              Preços
            </a>
            <Link to="/teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline">
              Encontrar Professoras
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient" size="sm">
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a 
                href="#funcionalidades" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Funcionalidades
              </a>
              <a 
                href="#depoimentos" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Depoimentos
              </a>
              <a 
                href="#precos" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Preços
              </a>
              <Link 
                to="/teachers" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Encontrar Professoras
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">
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
